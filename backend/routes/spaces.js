const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Space = require('../models/Space');
const History = require('../models/History');

// Helper to get Socket.io instance
const getIO = (req) => {
  return req.app.get('io');
};

// Helper function to check if user is space owner
const isSpaceOwner = async (spaceId, userId) => {
  const space = await Space.findById(spaceId);
  if (!space) return { allowed: false, space: null };
  return { allowed: space.owner.toString() === userId.toString(), space };
};

// Helper function to check if user is space member
const isSpaceMember = async (spaceId, userId) => {
  const space = await Space.findById(spaceId);
  if (!space) return { allowed: false, space: null };
  const isOwner = space.owner.toString() === userId.toString();
  const isMember = space.members.some(member => member.toString() === userId.toString());
  return { allowed: isOwner || isMember, space };
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

// GET /api/spaces - Get all spaces for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const spaces = await Space.find({
      $or: [
        { owner: req.user._id },
        { members: req.user._id }
      ]
    })
    .populate('owner', 'name email avatar')
    .populate('members', 'name email avatar')
    .sort({ createdAt: -1 });

    res.json(spaces);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/spaces/:id - Get a specific space by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { allowed, space } = await isSpaceMember(req.params.id, req.user._id);
    
    if (!allowed) {
      return res.status(403).json({ message: 'Access denied. Space member required.' });
    }

    const populatedSpace = await Space.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    res.json(populatedSpace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/spaces - Create a new space
router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Space name is required' });
    }

    const space = await Space.create({
      name,
      owner: req.user._id,
      members: []
    });

    // Log history
    await logHistory('space', space._id, 'created', req.user._id, { name });

    const populatedSpace = await Space.findById(space._id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    // Emit Socket.io event
    const io = getIO(req);
    if (io) {
      io.to(`space-${space._id}`).emit('space-created', populatedSpace);
    }

    res.status(201).json(populatedSpace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/spaces/:id - Update space details (Owner only)
router.put('/:id', auth, async (req, res) => {
  try {
    const { allowed, space } = await isSpaceOwner(req.params.id, req.user._id);
    
    if (!allowed) {
      return res.status(403).json({ message: 'Access denied. Space Owner required.' });
    }

    const { name } = req.body;
    const oldName = space.name;

    if (name) {
      space.name = name;
      await space.save();
    }

    // Log history
    if (name && name !== oldName) {
      await logHistory('space', space._id, 'updated', req.user._id, {
        field: 'name',
        oldValue: oldName,
        newValue: name
      });
    }

    const populatedSpace = await Space.findById(space._id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    // Emit Socket.io event
    const io = getIO(req);
    if (io) {
      io.to(`space-${space._id}`).emit('space-updated', populatedSpace);
    }

    res.json(populatedSpace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/spaces/:id - Delete a space (Owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { allowed, space } = await isSpaceOwner(req.params.id, req.user._id);
    
    if (!allowed) {
      return res.status(403).json({ message: 'Access denied. Space Owner required.' });
    }

    // Log history before deletion
    await logHistory('space', space._id, 'deleted', req.user._id, { name: space.name });

    // Emit Socket.io event before deletion
    const io = getIO(req);
    if (io) {
      io.to(`space-${space._id}`).emit('space-deleted', { spaceId: space._id });
    }

    await Space.findByIdAndDelete(req.params.id);

    res.json({ message: 'Space deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/spaces/:id/members - Add member to space (Owner only)
router.post('/:id/members', auth, async (req, res) => {
  try {
    const { allowed, space } = await isSpaceOwner(req.params.id, req.user._id);
    
    if (!allowed) {
      return res.status(403).json({ message: 'Access denied. Space Owner required.' });
    }

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Check if user is already a member
    if (space.members.includes(userId) || space.owner.toString() === userId) {
      return res.status(400).json({ message: 'User is already a member of this space' });
    }

    space.members.push(userId);
    await space.save();

    // Log history
    await logHistory('member', userId, 'added', req.user._id, {
      spaceId: space._id,
      spaceName: space.name
    });

    const populatedSpace = await Space.findById(space._id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    // Emit Socket.io event
    const io = getIO(req);
    if (io) {
      io.to(`space-${space._id}`).emit('member-added', { space: populatedSpace, userId });
    }

    res.json(populatedSpace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/spaces/:id/members/:userId - Remove member from space (Owner only)
router.delete('/:id/members/:userId', auth, async (req, res) => {
  try {
    const { allowed, space } = await isSpaceOwner(req.params.id, req.user._id);
    
    if (!allowed) {
      return res.status(403).json({ message: 'Access denied. Space Owner required.' });
    }

    const { userId } = req.params;

    if (space.owner.toString() === userId) {
      return res.status(400).json({ message: 'Cannot remove space owner' });
    }

    space.members = space.members.filter(
      member => member.toString() !== userId
    );
    await space.save();

    // Log history
    await logHistory('member', userId, 'removed', req.user._id, {
      spaceId: space._id,
      spaceName: space.name
    });

    const populatedSpace = await Space.findById(space._id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    // Emit Socket.io event
    const io = getIO(req);
    if (io) {
      io.to(`space-${space._id}`).emit('member-removed', { space: populatedSpace, userId });
    }

    res.json(populatedSpace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
