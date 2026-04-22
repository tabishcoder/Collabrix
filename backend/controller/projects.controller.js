const Space = require('../models/Space');
const Project = require('../models/Project');
const History = require('../models/History');
const Invitation = require('../models/Invitation');
const crypto = require('crypto');
const { sendProjectInvitationEmail } = require('../utils/email');

// Helper to get Socket.io instance
const getIO = (req) => {
  return req.app.get ? req.app.get('io') : null;
};

// Helper function to check if user is space member
const isSpaceMember = async (spaceId, userId) => {
  const space = await Space.findById(spaceId);
  if (!space) return { allowed: false, space: null };
  const isOwner = space.owner.toString() === userId.toString();
  const isMember = space.members.some(member => member.toString() === userId.toString());
  return { allowed: isOwner || isMember, space };
};

// Helper function to check if user is project member
const isProjectMember = async (projectId, userId) => {
  const project = await Project.findById(projectId).populate('spaceId');
  if (!project) return { allowed: false, project: null, space: null };

  const space = project.spaceId;
  const isSpaceOwner = space.owner.toString() === userId.toString();
  const isSpaceMember = space.members.some(member => member.toString() === userId.toString());
  const isProjectMember = project.members.some(member => member.toString() === userId.toString());

  return {
    allowed: isSpaceOwner || isSpaceMember || isProjectMember,
    project,
    space
  };
};

// Helper function to log history
const logHistory = async (entityType, entityId, action, performedBy, details = {}) => {
  await History.create({
    entityType,
    entityId,
    action,
    performedBy,
    details
  });
};

module.exports.getProjectsBySpace = async (req, res) => {
  try {
    const { allowed } = await isSpaceMember(req.params.spaceId, req.user._id);

    if (!allowed) {
      return res.status(403).json({ message: 'Access denied. Space member required.' });
    }

    const projects = await Project.find({ spaceId: req.params.spaceId })
      .populate('members', 'name email avatar')
      .populate('tasks')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports.getProjectById = async (req, res) => {
  try {
    const { allowed } = await isProjectMember(req.params.id, req.user._id);

    if (!allowed) {
      return res.status(403).json({ message: 'Access denied. Project member required.' });
    }

    const populatedProject = await Project.findById(req.params.id)
      .populate('spaceId')
      .populate('members', 'name email avatar')
      .populate('tasks');

    res.json(populatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports.createProject = async (req, res) => {
  try {
    const { name, spaceId } = req.body;

    if (!name || !spaceId) {
      return res.status(400).json({ message: 'Project name and spaceId are required' });
    }

    const { allowed } = await isSpaceMember(spaceId, req.user._id);

    if (!allowed) {
      return res.status(403).json({ message: 'Access denied. Space member required.' });
    }

    const project = await Project.create({
      name,
      spaceId,
      members: [],
      tasks: []
    });

    await logHistory('project', project._id, 'created', req.user._id, { name, spaceId });

    const populatedProject = await Project.findById(project._id)
      .populate('spaceId')
      .populate('members', 'name email avatar')
      .populate('tasks');

    const io = getIO(req);
    if (io) {
      io.to(`space-${spaceId}`).emit('project-created', populatedProject);
      io.to(`project-${project._id}`).emit('project-created', populatedProject);
    }

    res.status(201).json(populatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports.updateProject = async (req, res) => {
  try {
    const { allowed, project } = await isProjectMember(req.params.id, req.user._id);

    if (!allowed) {
      return res.status(403).json({ message: 'Access denied. Project member required.' });
    }

    const { name } = req.body;
    const oldName = project.name;

    if (name) {
      project.name = name;
      await project.save();
    }

    if (name && name !== oldName) {
      await logHistory('project', project._id, 'updated', req.user._id, {
        field: 'name',
        oldValue: oldName,
        newValue: name
      });
    }

    const populatedProject = await Project.findById(project._id)
      .populate('spaceId')
      .populate('members', 'name email avatar')
      .populate('tasks');

    const io = getIO(req);
    if (io) {
      const spaceId = populatedProject.spaceId._id || populatedProject.spaceId;
      io.to(`space-${spaceId}`).emit('project-updated', populatedProject);
      io.to(`project-${project._id}`).emit('project-updated', populatedProject);
    }

    res.json(populatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports.deleteProject = async (req, res) => {
  try {
    const { allowed, project } = await isProjectMember(req.params.id, req.user._id);

    if (!allowed) {
      return res.status(403).json({ message: 'Access denied. Project member required.' });
    }

    await logHistory('project', project._id, 'deleted', req.user._id, { name: project.name });

    const spaceId = project.spaceId._id || project.spaceId;

    const io = getIO(req);
    if (io) {
      io.to(`space-${spaceId}`).emit('project-deleted', { projectId: project._id });
      io.to(`project-${project._id}`).emit('project-deleted', { projectId: project._id });
    }

    await Project.findByIdAndDelete(req.params.id);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports.addProjectMember = async (req, res) => {
  try {
    const { allowed, project, space } = await isProjectMember(req.params.id, req.user._id);

    if (!allowed) {
      return res.status(403).json({ message: 'Access denied. Project member required.' });
    }

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const isSpaceOwner = space.owner.toString() === userId.toString();
    const isSpaceMember = space.members.some(member => member.toString() === userId.toString());

    if (!isSpaceOwner && !isSpaceMember) {
      return res.status(400).json({ message: 'User must be a space member to be added to project' });
    }

    if (project.members.includes(userId)) {
      return res.status(400).json({ message: 'User is already a member of this project' });
    }

    project.members.push(userId);
    await project.save();

    await logHistory('member', userId, 'added', req.user._id, {
      projectId: project._id,
      projectName: project.name
    });

    const populatedProject = await Project.findById(project._id)
      .populate('spaceId')
      .populate('members', 'name email avatar')
      .populate('tasks');

    const io = getIO(req);
    if (io) {
      const spaceId = populatedProject.spaceId._id || populatedProject.spaceId;
      io.to(`space-${spaceId}`).emit('project-member-added', { project: populatedProject, userId });
      io.to(`project-${project._id}`).emit('project-member-added', { project: populatedProject, userId });
    }

    res.json(populatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports.removeProjectMember = async (req, res) => {
  try {
    const { allowed, project } = await isProjectMember(req.params.id, req.user._id);

    if (!allowed) {
      return res.status(403).json({ message: 'Access denied. Project member required.' });
    }

    const { userId } = req.params;

    project.members = project.members.filter(
      member => member.toString() !== userId
    );
    await project.save();

    await logHistory('member', userId, 'removed', req.user._id, {
      projectId: project._id,
      projectName: project.name
    });

    const populatedProject = await Project.findById(project._id)
      .populate('spaceId')
      .populate('members', 'name email avatar')
      .populate('tasks');

    const io = getIO(req);
    if (io) {
      const spaceId = populatedProject.spaceId._id || populatedProject.spaceId;
      io.to(`space-${spaceId}`).emit('project-member-removed', { project: populatedProject, userId });
      io.to(`project-${project._id}`).emit('project-member-removed', { project: populatedProject, userId });
    }

    res.json(populatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports.inviteUserToProject = async (req, res) => {
  try {
    const { allowed, project } = await isProjectMember(req.params.id, req.user._id);

    if (!allowed) {
      return res.status(403).json({ message: 'Access denied. Project member required.' });
    }

    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required to invite a user' });
    }

    const existingInvitation = await Invitation.findOne({ 
      projectId: req.params.id, 
      invitedEmail: email.toLowerCase(),
      status: 'invited' 
    });

    if (existingInvitation) {
      await Invitation.findByIdAndDelete(existingInvitation._id);
    }

    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const invitation = await Invitation.create({
      invitedEmail: email.toLowerCase(),
      inviterId: req.user._id,
      projectId: req.params.id,
      hashedToken
    });

    const inviteLink = `${process.env.CLIENT_URL || 'http://localhost:3000'}/projects/${req.params.id}/join?token=${token}`;
    
    await sendProjectInvitationEmail(email, req.user.name, project.name, inviteLink);

    await logHistory('project', project._id, 'invitation_sent', req.user._id, { invitedEmail: email });

    res.status(200).json({ message: 'Invitation sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports.verifyProjectInvitation = async (req, res) => {
  try {
    const { token, email } = req.body;
    
    if (!token || !email) {
      return res.status(400).json({ message: 'Token and email are required' });
    }

    if (req.user.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ message: 'You can only accept invitations sent to your own email address' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const invitation = await Invitation.findOne({
      projectId: req.params.id,
      invitedEmail: email.toLowerCase(),
      hashedToken,
      status: 'invited'
    });

    if (!invitation) {
      return res.status(400).json({ message: 'Invalid or expired invitation token' });
    }

    if (req.user.email.toLowerCase() !== invitation.invitedEmail.toLowerCase()) {
      return res.status(403).json({ message: 'You can only accept invitations sent to your own email address' });
    }

    const project = await Project.findById(req.params.id).populate('spaceId');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.members.includes(req.user._id)) {
      project.members.push(req.user._id);
      await project.save();
    }

    const space = project.spaceId;
    let addedToSpace = false;
    if (space) {
       const isSpaceOwner = space.owner.toString() === req.user._id.toString();
       const isSpaceMember = space.members.some(member => member.toString() === req.user._id.toString());
       
       if (!isSpaceOwner && !isSpaceMember) {
           space.members.push(req.user._id);
           await space.save();
           addedToSpace = true;
       }
    }

    invitation.status = 'accepted';
    await invitation.save();

    await logHistory('member', req.user._id, 'joined_via_invite', req.user._id, {
      projectId: project._id,
      projectName: project.name
    });

    const populatedProject = await Project.findById(project._id)
      .populate('spaceId')
      .populate('members', 'name email avatar')
      .populate('tasks');

    const io = getIO(req);
    if (io) {
      const spaceId = space._id || space;
      io.to(`space-${spaceId}`).emit('project-member-added', { project: populatedProject, userId: req.user._id });
      io.to(`project-${project._id}`).emit('project-member-added', { project: populatedProject, userId: req.user._id });
      if (addedToSpace) {
          io.to(`space-${spaceId}`).emit('space-member-added', { spaceId, userId: req.user._id });
      }
    }

    res.status(200).json({ message: 'Successfully joined the project', project: populatedProject });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
