const Space   = require('../models/Space');
const Project = require('../models/Project');
const History = require('../models/History');
const {
  getSpaceRole,
  getProjectRole,
  SPACE_ADMIN_ROLES,
  PROJECT_MANAGE_ROLES,
  PROJECT_WRITE_ROLES
} = require('../utils/rbac');
const { ensureProjectChannel, syncProjectChannelParticipants } = require('../services/chatService');

const getIO = (req) => req.app.get('io');

// ─── Internal helpers ────────────────────────────────────────────────────────

const logHistory = async (entityType, entityId, action, performedBy, details = {}) => {
  await History.create({ entityType, entityId, action, performedBy, details });
};

const populateProject = (query) =>
  query
    .populate({
      path: 'spaceId',
      select: 'name owner members',
      populate: [
        { path: 'owner', select: 'name email avatar' },
        { path: 'members.user', select: 'name email avatar' },
      ],
    })
    .populate({ path: 'members.user', select: 'name email avatar' })
    .populate('tasks');

/**
 * Appends myRole to project response.
 */
const withMyRole = (project, role) => {
  const obj = project.toObject ? project.toObject() : { ...project };
  obj.myRole = role;
  return obj;
};

// ─── CRUD ─────────────────────────────────────────────────────────────────────

module.exports.getProjectsBySpace = async (req, res) => {
  try {
    const { role } = await getSpaceRole(req.params.spaceId, req.user._id);
    if (!role) return res.status(403).json({ message: 'Access denied. Space membership required.' });

    const projects = await populateProject(
      Project.find({ spaceId: req.params.spaceId }).sort({ createdAt: -1 })
    );

    // Attach myRole to each project
    const withRoles = await Promise.all(
      projects.map(async (p) => {
        const { role: pRole } = await getProjectRole(p._id, req.user._id);
        return withMyRole(p, pRole);
      })
    );

    res.json(withRoles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports.getProjectById = async (req, res) => {
  try {
    const { role } = await getProjectRole(req.params.id, req.user._id);
    if (!role) return res.status(403).json({ message: 'Access denied.' });

    const project = await populateProject(Project.findById(req.params.id));
    res.json(withMyRole(project, role));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports.createProject = async (req, res) => {
  try {
    const { name, spaceId } = req.body;
    if (!name || !spaceId) {
      return res.status(400).json({ message: 'Project name and spaceId are required' });
    }

    // Only space owner/admin can create projects
    const { role: spaceRole } = await getSpaceRole(spaceId, req.user._id);
    if (!SPACE_ADMIN_ROLES.includes(spaceRole)) {
      return res.status(403).json({ message: 'Access denied. Owner or admin can create projects.' });
    }

    // Creator is automatically added as manager
    const project = await Project.create({
      name,
      spaceId,
      members: [{ user: req.user._id, role: 'manager' }],
      tasks: []
    });

    await logHistory('project', project._id, 'created', req.user._id, { name, spaceId });

    const populated = await populateProject(Project.findById(project._id));
    const io = getIO(req);
    if (io) {
      io.to(`space-${spaceId}`).emit('project-created', populated);
    }

    try {
      await ensureProjectChannel(project._id);
    } catch (e) {
      console.error('ensureProjectChannel', e?.message);
    }

    res.status(201).json(withMyRole(populated, 'manager'));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports.updateProject = async (req, res) => {
  try {
    const { role, project } = await getProjectRole(req.params.id, req.user._id);
    if (!PROJECT_MANAGE_ROLES.includes(role)) {
      return res.status(403).json({ message: 'Access denied. Manager or above required.' });
    }

    const { name } = req.body;
    const oldName = project.name;
    if (name) { project.name = name; await project.save(); }

    if (name && name !== oldName) {
      await logHistory('project', project._id, 'updated', req.user._id,
        { field: 'name', oldValue: oldName, newValue: name });
    }

    const populated = await populateProject(Project.findById(project._id));
    const io = getIO(req);
    if (io) {
      io.to(`space-${project.spaceId}`).emit('project-updated', populated);
      io.to(`project-${project._id}`).emit('project-updated', populated);
    }

    res.json(withMyRole(populated, role));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports.deleteProject = async (req, res) => {
  try {
    const { role, project } = await getProjectRole(req.params.id, req.user._id);
    if (!PROJECT_MANAGE_ROLES.includes(role)) {
      return res.status(403).json({ message: 'Access denied. Manager or above required.' });
    }

    await logHistory('project', project._id, 'deleted', req.user._id, { name: project.name });

    const io = getIO(req);
    if (io) {
      io.to(`space-${project.spaceId}`).emit('project-deleted', { projectId: project._id });
      io.to(`project-${project._id}`).emit('project-deleted', { projectId: project._id });
    }

    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Board Columns ────────────────────────────────────────────────────────────

module.exports.updateBoardColumns = async (req, res) => {
  try {
    const { role, project } = await getProjectRole(req.params.id, req.user._id);
    if (!PROJECT_MANAGE_ROLES.includes(role)) {
      return res.status(403).json({ message: 'Access denied. Manager or above required.' });
    }

    const { columns } = req.body; // [{ key, name, order }]
    if (!Array.isArray(columns) || columns.length === 0) {
      return res.status(400).json({ message: 'columns must be a non-empty array' });
    }

    // Validate each column has required fields + unique keys
    const keys = new Set();
    for (const col of columns) {
      if (!col.key || !col.name || col.order == null) {
        return res.status(400).json({ message: 'Each column needs key, name, and order' });
      }
      if (keys.has(col.key)) {
        return res.status(400).json({ message: `Duplicate column key: ${col.key}` });
      }
      keys.add(col.key);
    }

    project.boardColumns = columns.map((c, i) => ({
      key: c.key.trim().toLowerCase().replace(/\s+/g, '_'),
      name: c.name.trim(),
      order: typeof c.order === 'number' ? c.order : i
    }));
    await project.save();

    await logHistory('project', project._id, 'columns_updated', req.user._id, { columns });

    const populated = await populateProject(Project.findById(project._id));
    const io = getIO(req);
    if (io) {
      io.to(`project-${project._id}`).emit('board-columns-updated', {
        projectId: project._id,
        boardColumns: project.boardColumns
      });
    }

    res.json(withMyRole(populated, role));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Project member management ────────────────────────────────────────────────

module.exports.addProjectMember = async (req, res) => {
  try {
    const { role: callerRole, project, space } = await getProjectRole(req.params.id, req.user._id);
    if (!PROJECT_MANAGE_ROLES.includes(callerRole)) {
      return res.status(403).json({ message: 'Access denied. Manager or above required.' });
    }

    const { userId, role: memberRole = 'contributor' } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId is required' });
    if (!['manager', 'contributor', 'viewer'].includes(memberRole)) {
      return res.status(400).json({ message: 'role must be manager, contributor, or viewer' });
    }

    // User must be a space member or owner first
    const isSpaceOwner  = space.owner.toString() === userId.toString();
    const isSpaceMember = space.members.some((m) => m.user.toString() === userId.toString());
    if (!isSpaceOwner && !isSpaceMember) {
      return res.status(400).json({ message: 'User must be a space member before joining a project' });
    }

    const alreadyMember = project.members.some((m) => m.user.toString() === userId);
    if (alreadyMember) {
      return res.status(400).json({ message: 'User is already a project member' });
    }

    project.members.push({ user: userId, role: memberRole });
    await project.save();

    await logHistory('member', userId, 'added', req.user._id,
      { projectId: project._id, projectName: project.name, role: memberRole });

    const populated = await populateProject(Project.findById(project._id));
    const io = getIO(req);
    if (io) {
      io.to(`space-${project.spaceId}`).emit('project-member-added', { project: populated, userId });
      io.to(`project-${project._id}`).emit('project-member-added', { project: populated, userId });
    }

    try {
      await syncProjectChannelParticipants(project._id);
    } catch (e) {
      console.error('syncProjectChannelParticipants', e?.message);
    }

    res.json(withMyRole(populated, callerRole));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports.updateProjectMemberRole = async (req, res) => {
  try {
    const { role: callerRole, project } = await getProjectRole(req.params.id, req.user._id);
    if (!PROJECT_MANAGE_ROLES.includes(callerRole)) {
      return res.status(403).json({ message: 'Access denied. Manager or above required.' });
    }

    const { userId } = req.params;
    const { role: newRole } = req.body;
    if (!['manager', 'contributor', 'viewer'].includes(newRole)) {
      return res.status(400).json({ message: 'role must be manager, contributor, or viewer' });
    }

    const membership = project.members.find((m) => m.user.toString() === userId);
    if (!membership) return res.status(404).json({ message: 'Member not found' });

    // Explicit project managers cannot change their own role via this endpoint (avoids self-demotion / privilege games). Owner/admin (implicit) are not in members[].
    if (req.user._id.toString() === userId && callerRole === 'manager') {
      return res.status(403).json({
        message: 'You cannot change your own project role. Ask another manager or a workspace admin.',
      });
    }

    membership.role = newRole;
    await project.save();

    await logHistory('member', userId, 'role_changed', req.user._id,
      { projectId: project._id, newRole });

    const populated = await populateProject(Project.findById(project._id));
    res.json(withMyRole(populated, callerRole));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports.removeProjectMember = async (req, res) => {
  try {
    const { role: callerRole, project } = await getProjectRole(req.params.id, req.user._id);
    if (!PROJECT_MANAGE_ROLES.includes(callerRole)) {
      return res.status(403).json({ message: 'Access denied. Manager or above required.' });
    }

    const { userId } = req.params;
    if (req.user._id.toString() === userId) {
      return res.status(400).json({ message: 'Use leave project to remove yourself from the team.' });
    }

    project.members = project.members.filter((m) => m.user.toString() !== userId);
    await project.save();

    await logHistory('member', userId, 'removed', req.user._id,
      { projectId: project._id, projectName: project.name });

    const populated = await populateProject(Project.findById(project._id));
    const io = getIO(req);
    if (io) {
      io.to(`space-${project.spaceId}`).emit('project-member-removed', { project: populated, userId });
      io.to(`project-${project._id}`).emit('project-member-removed', { project: populated, userId });
    }

    try {
      await syncProjectChannelParticipants(project._id);
    } catch (e) {
      console.error('syncProjectChannelParticipants', e?.message);
    }

    res.json(withMyRole(populated, callerRole));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Self leave ────────────────────────────────────────────────────────────────

/**
 * A project member can leave the project.
 * Note: Space owners/admins have implicit access; they cannot "leave" a project here.
 *
 * DELETE /api/projects/:id/members/me
 */
module.exports.leaveProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user._id.toString();

    const { role, project } = await getProjectRole(projectId, req.user._id);
    if (!role) return res.status(403).json({ message: 'Access denied.' });

    if (role === 'owner' || role === 'admin') {
      return res.status(400).json({
        message: 'Workspace owners/admins have workspace-level access and cannot leave projects via this endpoint.'
      });
    }

    const membership = project.members.find((m) => m.user.toString() === userId);
    if (!membership) {
      return res.status(400).json({ message: 'You are not an explicit member of this project.' });
    }

    // Prevent last manager from leaving if there are other members
    const managers = project.members.filter((m) => m.role === 'manager');
    if (membership.role === 'manager' && managers.length === 1 && project.members.length > 1) {
      return res.status(400).json({ message: 'You are the last manager. Assign another manager before leaving.' });
    }

    project.members = project.members.filter((m) => m.user.toString() !== userId);
    await project.save();

    await logHistory('member', req.user._id, 'removed', req.user._id, { projectId, self: true });

    const io = getIO(req);
    if (io) {
      io.to(`project-${projectId}`).emit('project-member-removed', { projectId, userId });
      io.to(`space-${project.spaceId}`).emit('project-member-removed', { projectId, userId });
    }

    try {
      await syncProjectChannelParticipants(projectId);
    } catch (e) {
      console.error('syncProjectChannelParticipants', e?.message);
    }

    res.json({ message: 'Left project successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
