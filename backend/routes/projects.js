const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Space = require('../models/Space');
const Project = require('../models/Project');
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

// GET /api/projects/space/:spaceId - Get all projects in a space
router.get('/space/:spaceId', auth, async (req, res) => {
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
});

// GET /api/projects/:id - Get a specific project by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { allowed, project } = await isProjectMember(req.params.id, req.user._id);
    
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
});

// POST /api/projects - Create a new project
router.post('/', auth, async (req, res) => {
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

    // Log history
    await logHistory('project', project._id, 'created', req.user._id, { name, spaceId });

    const populatedProject = await Project.findById(project._id)
      .populate('spaceId')
      .populate('members', 'name email avatar')
      .populate('tasks');

    // Emit Socket.io events
    const io = getIO(req);
    if (io) {
      io.to(`space-${spaceId}`).emit('project-created', populatedProject);
      io.to(`project-${project._id}`).emit('project-created', populatedProject);
    }

    res.status(201).json(populatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/projects/:id - Update project details
router.put('/:id', auth, async (req, res) => {
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

    // Log history
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

    // Emit Socket.io events
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
});

// DELETE /api/projects/:id - Delete a project
router.delete('/:id', auth, async (req, res) => {
  try {
    const { allowed, project } = await isProjectMember(req.params.id, req.user._id);
    
    if (!allowed) {
      return res.status(403).json({ message: 'Access denied. Project member required.' });
    }

    // Log history before deletion
    await logHistory('project', project._id, 'deleted', req.user._id, { name: project.name });

    const spaceId = project.spaceId._id || project.spaceId;

    // Emit Socket.io events before deletion
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
});

// POST /api/projects/:id/members - Add member to project
router.post('/:id/members', auth, async (req, res) => {
  try {
    const { allowed, project, space } = await isProjectMember(req.params.id, req.user._id);
    
    if (!allowed) {
      return res.status(403).json({ message: 'Access denied. Project member required.' });
    }

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Check if user is a space member
    const isSpaceOwner = space.owner.toString() === userId.toString();
    const isSpaceMember = space.members.some(member => member.toString() === userId.toString());
    
    if (!isSpaceOwner && !isSpaceMember) {
      return res.status(400).json({ message: 'User must be a space member to be added to project' });
    }

    // Check if user is already a project member
    if (project.members.includes(userId)) {
      return res.status(400).json({ message: 'User is already a member of this project' });
    }

    project.members.push(userId);
    await project.save();

    // Log history
    await logHistory('member', userId, 'added', req.user._id, {
      projectId: project._id,
      projectName: project.name
    });

    const populatedProject = await Project.findById(project._id)
      .populate('spaceId')
      .populate('members', 'name email avatar')
      .populate('tasks');

    // Emit Socket.io events
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
});

// DELETE /api/projects/:id/members/:userId - Remove member from project
router.delete('/:id/members/:userId', auth, async (req, res) => {
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

    // Log history
    await logHistory('member', userId, 'removed', req.user._id, {
      projectId: project._id,
      projectName: project.name
    });

    const populatedProject = await Project.findById(project._id)
      .populate('spaceId')
      .populate('members', 'name email avatar')
      .populate('tasks');

    // Emit Socket.io events
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
});

module.exports = router;
