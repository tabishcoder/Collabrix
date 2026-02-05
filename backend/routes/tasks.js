const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Space = require('../models/Space');
const Project = require('../models/Project');
const Task = require('../models/Task');
const History = require('../models/History');

// Helper to get Socket.io instance
const getIO = (req) => {
  return req.app.get('io');
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

// GET /api/tasks/project/:projectId - Get all tasks in a project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const { allowed } = await isProjectMember(req.params.projectId, req.user._id);
    
    if (!allowed) {
      return res.status(403).json({ message: 'Access denied. Project member required.' });
    }

    const tasks = await Task.find({ projectId: req.params.projectId })
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/tasks/:id - Get a specific task by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('projectId');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { allowed } = await isProjectMember(task.projectId._id, req.user._id);
    
    if (!allowed) {
      return res.status(403).json({ message: 'Access denied. Project member required.' });
    }

    const populatedTask = await Task.findById(req.params.id)
      .populate('projectId')
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    res.json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/tasks - Create a new task
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, projectId, assignee } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({ message: 'Task title and projectId are required' });
    }

    const { allowed, project } = await isProjectMember(projectId, req.user._id);
    
    if (!allowed) {
      return res.status(403).json({ message: 'Access denied. Project member required.' });
    }

    // Validate assignee is a project member if provided
    if (assignee) {
      const isSpaceOwner = project.spaceId.owner.toString() === assignee.toString();
      const isSpaceMember = project.spaceId.members.some(member => member.toString() === assignee.toString());
      const isProjectMember = project.members.some(member => member.toString() === assignee.toString());
      
      if (!isSpaceOwner && !isSpaceMember && !isProjectMember) {
        return res.status(400).json({ message: 'Assignee must be a project member' });
      }
    }

    const task = await Task.create({
      title,
      description: description || '',
      status: 'todo',
      projectId,
      assignee: assignee || null,
      createdBy: req.user._id
    });

    // Add task to project's tasks array
    project.tasks.push(task._id);
    await project.save();

    // Log history
    await logHistory('task', task._id, 'created', req.user._id, {
      title,
      projectId,
      assignee: assignee || null
    });

    const populatedTask = await Task.findById(task._id)
      .populate('projectId')
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    // Emit Socket.io events
    const io = getIO(req);
    if (io) {
      const projectId = populatedTask.projectId._id || populatedTask.projectId;
      const project = await Project.findById(projectId).populate('spaceId');
      const spaceId = project.spaceId._id || project.spaceId;
      
      io.to(`space-${spaceId}`).emit('task-created', populatedTask);
      io.to(`project-${projectId}`).emit('task-created', populatedTask);
    }

    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/tasks/:id - Update task details
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('projectId');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { allowed } = await isProjectMember(task.projectId._id, req.user._id);
    
    if (!allowed) {
      return res.status(403).json({ message: 'Access denied. Project member required.' });
    }

    const { title, description, status, assignee } = req.body;
    const oldStatus = task.status;
    const oldAssignee = task.assignee ? task.assignee.toString() : null;

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (status) {
      if (!['todo', 'in_progress', 'done'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Must be todo, in_progress, or done' });
      }
      task.status = status;
    }
    if (assignee !== undefined) {
      if (assignee === null) {
        task.assignee = null;
      } else {
        // Validate assignee is a project member
        const project = await Project.findById(task.projectId._id).populate('spaceId');
        const isSpaceOwner = project.spaceId.owner.toString() === assignee.toString();
        const isSpaceMember = project.spaceId.members.some(member => member.toString() === assignee.toString());
        const isProjectMember = project.members.some(member => member.toString() === assignee.toString());
        
        if (!isSpaceOwner && !isSpaceMember && !isProjectMember) {
          return res.status(400).json({ message: 'Assignee must be a project member' });
        }
        task.assignee = assignee;
      }
    }

    await task.save();

    // Log history for status changes
    if (status && status !== oldStatus) {
      await logHistory('task', task._id, 'moved', req.user._id, {
        oldStatus,
        newStatus: status
      });
    }

    // Log history for assignee changes
    if (assignee !== undefined && assignee !== oldAssignee) {
      await logHistory('task', task._id, 'assigned', req.user._id, {
        oldAssignee,
        newAssignee: assignee
      });
    }

    // Log history for other updates
    if (title || description !== undefined) {
      await logHistory('task', task._id, 'updated', req.user._id, {
        title: title || task.title,
        description: description !== undefined ? description : task.description
      });
    }

    const populatedTask = await Task.findById(task._id)
      .populate('projectId')
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    // Emit Socket.io events
    const io = getIO(req);
    if (io) {
      const projectId = populatedTask.projectId._id || populatedTask.projectId;
      const project = await Project.findById(projectId).populate('spaceId');
      const spaceId = project.spaceId._id || project.spaceId;
      
      io.to(`space-${spaceId}`).emit('task-updated', populatedTask);
      io.to(`project-${projectId}`).emit('task-updated', populatedTask);
    }

    res.json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('projectId');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { allowed, project } = await isProjectMember(task.projectId._id, req.user._id);
    
    if (!allowed) {
      return res.status(403).json({ message: 'Access denied. Project member required.' });
    }

    // Remove task from project's tasks array
    project.tasks = project.tasks.filter(
      taskId => taskId.toString() !== task._id.toString()
    );
    await project.save();

    // Log history before deletion
    await logHistory('task', task._id, 'deleted', req.user._id, { title: task.title });

    const projectId = task.projectId._id || task.projectId;
    const projectWithSpace = await Project.findById(projectId).populate('spaceId');
    const spaceId = projectWithSpace.spaceId._id || projectWithSpace.spaceId;

    // Emit Socket.io events before deletion
    const io = getIO(req);
    if (io) {
      io.to(`space-${spaceId}`).emit('task-deleted', { taskId: task._id, projectId });
      io.to(`project-${projectId}`).emit('task-deleted', { taskId: task._id, projectId });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
