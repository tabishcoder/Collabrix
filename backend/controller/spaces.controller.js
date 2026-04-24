const Space   = require('../models/Space');
const Project = require('../models/Project');
const History = require('../models/History');
const { getSpaceRole, SPACE_ADMIN_ROLES } = require('../utils/rbac');

const getIO = (req) => req.app.get('io');

// ─── Internal helpers ────────────────────────────────────────────────────────

const logHistory = async (entityType, entityId, action, performedBy, details = {}) => {
  await History.create({ entityType, entityId, action, performedBy, details });
};

/** Populate members.user for a space query. */
const populateSpace = (query) =>
  query
    .populate('owner', 'name email avatar')
    .populate({ path: 'members.user', select: 'name email avatar' });

/**
 * Append the requesting user's role to the space object before sending.
 * Keeps the response self-contained for the frontend.
 */
const withMyRole = (space, userId) => {
  const obj = space.toObject();
  if (obj.owner._id?.toString() === userId.toString() ||
      obj.owner.toString?.() === userId.toString()) {
    obj.myRole = 'owner';
  } else {
    const m = space.members.find((m) => m.user?._id?.toString() === userId.toString()
      || m.user?.toString() === userId.toString());
    obj.myRole = m?.role ?? 'member';
  }
  return obj;
};

// ─── Controllers ─────────────────────────────────────────────────────────────

module.exports.getAllSpaces = async (req, res) => {
  try {
    const spaces = await populateSpace(
      Space.find({
        $or: [
          { owner: req.user._id },
          { 'members.user': req.user._id }
        ]
      }).sort({ createdAt: -1 })
    );

    res.json(spaces.map((s) => withMyRole(s, req.user._id)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports.getSpaceById = async (req, res) => {
  try {
    const { role } = await getSpaceRole(req.params.id, req.user._id);
    if (!role) return res.status(403).json({ message: 'Access denied.' });

    const space = await populateSpace(Space.findById(req.params.id));
    res.json(withMyRole(space, req.user._id));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports.createSpace = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Space name is required' });

    const space = await Space.create({ name, owner: req.user._id, members: [] });
    await logHistory('space', space._id, 'created', req.user._id, { name });

    const populated = await populateSpace(Space.findById(space._id));
    const io = getIO(req);
    if (io) io.to(`space-${space._id}`).emit('space-created', populated);

    res.status(201).json(withMyRole(populated, req.user._id));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports.updateSpace = async (req, res) => {
  try {
    const { role, space } = await getSpaceRole(req.params.id, req.user._id);
    if (!SPACE_ADMIN_ROLES.includes(role)) {
      return res.status(403).json({ message: 'Access denied. Owner or admin required.' });
    }

    const { name } = req.body;
    const oldName = space.name;
    if (name) { space.name = name; await space.save(); }

    if (name && name !== oldName) {
      await logHistory('space', space._id, 'updated', req.user._id,
        { field: 'name', oldValue: oldName, newValue: name });
    }

    const populated = await populateSpace(Space.findById(space._id));
    const io = getIO(req);
    if (io) io.to(`space-${space._id}`).emit('space-updated', populated);

    res.json(withMyRole(populated, req.user._id));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports.deleteSpace = async (req, res) => {
  try {
    const { role, space } = await getSpaceRole(req.params.id, req.user._id);
    if (role !== 'owner') {
      return res.status(403).json({ message: 'Access denied. Space owner required.' });
    }

    await logHistory('space', space._id, 'deleted', req.user._id, { name: space.name });
    const io = getIO(req);
    if (io) io.to(`space-${space._id}`).emit('space-deleted', { spaceId: space._id });

    await Space.findByIdAndDelete(req.params.id);
    res.json({ message: 'Space deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Member management ───────────────────────────────────────────────────────

module.exports.addSpaceMember = async (req, res) => {
  try {
    const { role: callerRole, space } = await getSpaceRole(req.params.id, req.user._id);
    if (!SPACE_ADMIN_ROLES.includes(callerRole)) {
      return res.status(403).json({ message: 'Access denied. Owner or admin required.' });
    }

    const { userId, role: newRole = 'member' } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId is required' });
    if (!['admin', 'member'].includes(newRole)) {
      return res.status(400).json({ message: 'role must be admin or member' });
    }

    if (space.owner.toString() === userId) {
      return res.status(400).json({ message: 'User is the space owner' });
    }
    const alreadyMember = space.members.some((m) => m.user.toString() === userId);
    if (alreadyMember) {
      return res.status(400).json({ message: 'User is already a member of this space' });
    }

    space.members.push({ user: userId, role: newRole });
    await space.save();

    await logHistory('member', userId, 'added', req.user._id,
      { spaceId: space._id, spaceName: space.name, role: newRole });

    const populated = await populateSpace(Space.findById(space._id));
    const io = getIO(req);
    if (io) io.to(`space-${space._id}`).emit('member-added', { space: populated, userId });

    res.json(withMyRole(populated, req.user._id));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports.updateSpaceMemberRole = async (req, res) => {
  try {
    const { role: callerRole, space } = await getSpaceRole(req.params.id, req.user._id);
    if (!SPACE_ADMIN_ROLES.includes(callerRole)) {
      return res.status(403).json({ message: 'Access denied. Owner or admin required.' });
    }

    const { userId } = req.params;
    const { role: newRole } = req.body;

    if (!['admin', 'member'].includes(newRole)) {
      return res.status(400).json({ message: 'role must be admin or member' });
    }
    if (space.owner.toString() === userId) {
      return res.status(400).json({ message: "Cannot change the owner's role" });
    }

    const membership = space.members.find((m) => m.user.toString() === userId);
    if (!membership) return res.status(404).json({ message: 'Member not found' });

    membership.role = newRole;
    await space.save();

    await logHistory('member', userId, 'role_changed', req.user._id,
      { spaceId: space._id, newRole });

    const populated = await populateSpace(Space.findById(space._id));
    const io = getIO(req);
    if (io) io.to(`space-${space._id}`).emit('member-updated', { space: populated, userId });

    res.json(withMyRole(populated, req.user._id));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports.removeSpaceMember = async (req, res) => {
  try {
    const { role: callerRole, space } = await getSpaceRole(req.params.id, req.user._id);
    if (!SPACE_ADMIN_ROLES.includes(callerRole)) {
      return res.status(403).json({ message: 'Access denied. Owner or admin required.' });
    }

    const { userId } = req.params;
    if (space.owner.toString() === userId) {
      return res.status(400).json({ message: 'Cannot remove the space owner' });
    }

    space.members = space.members.filter((m) => m.user.toString() !== userId);
    await space.save();

    await logHistory('member', userId, 'removed', req.user._id,
      { spaceId: space._id, spaceName: space.name });

    const populated = await populateSpace(Space.findById(space._id));
    const io = getIO(req);
    if (io) io.to(`space-${space._id}`).emit('member-removed', { space: populated, userId });

    res.json(withMyRole(populated, req.user._id));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Space members list ───────────────────────────────────────────────────────

module.exports.getSpaceMembers = async (req, res) => {
  try {
    const { role } = await getSpaceRole(req.params.id, req.user._id);
    if (!role) return res.status(403).json({ message: 'Access denied.' });

    const space = await populateSpace(Space.findById(req.params.id));
    const owner = { user: space.owner, role: 'owner', joinedAt: space.createdAt };
    res.json([owner, ...space.members]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Self leave ────────────────────────────────────────────────────────────────

/**
 * Any non-owner space member can leave the workspace.
 * Also removes the user from all projects in the workspace to prevent orphan access.
 *
 * DELETE /api/spaces/:id/members/me
 */
module.exports.leaveSpace = async (req, res) => {
  try {
    const spaceId = req.params.id;
    const userId = req.user._id.toString();

    const { role, space } = await getSpaceRole(spaceId, req.user._id);
    if (!role) return res.status(403).json({ message: 'Access denied.' });
    if (role === 'owner') {
      return res.status(400).json({ message: 'Workspace owner cannot leave their own workspace.' });
    }

    // Remove from space members
    const beforeCount = space.members.length;
    space.members = space.members.filter((m) => m.user.toString() !== userId);
    if (space.members.length === beforeCount) {
      return res.status(400).json({ message: 'You are not a member of this workspace.' });
    }
    await space.save();

    // Remove from all project memberships in this space
    await Project.updateMany(
      { spaceId, 'members.user': req.user._id },
      { $pull: { members: { user: req.user._id } } }
    );

    await logHistory('member', req.user._id, 'removed', req.user._id, { spaceId, self: true });

    const io = getIO(req);
    if (io) io.to(`space-${spaceId}`).emit('member-removed', { spaceId, userId });

    res.json({ message: 'Left workspace successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
