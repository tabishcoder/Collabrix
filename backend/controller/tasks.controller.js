const Project = require('../models/Project');
const Task    = require('../models/Task');
const History = require('../models/History');
const { getProjectRole, PROJECT_WRITE_ROLES } = require('../utils/rbac');

const getIO = (req) => req.app.get('io');

const logHistory = async (entityType, entityId, action, performedBy, details = {}) => {
  await History.create({ entityType, entityId, action, performedBy, details });
};

const populateTask = (query) =>
  query
    .populate('projectId')
    .populate('assignee',  'name email avatar')
    .populate('createdBy', 'name email avatar');

// ─── Read ─────────────────────────────────────────────────────────────────────

module.exports.getTasksByProject = async (req, res) => {
  try {
    const { role } = await getProjectRole(req.params.projectId, req.user._id);
    if (!role) return res.status(403).json({ message: 'Access denied.' });

    const tasks = await populateTask(
      Task.find({ projectId: req.params.projectId }).sort({ createdAt: -1 })
    );
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('projectId');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const { role } = await getProjectRole(task.projectId._id, req.user._id);
    if (!role) return res.status(403).json({ message: 'Access denied.' });

    res.json(await populateTask(Task.findById(req.params.id)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Create ───────────────────────────────────────────────────────────────────

module.exports.createTask = async (req, res) => {
  try {
    const { title, description, projectId, assignee, status } = req.body;
    if (!title || !projectId) {
      return res.status(400).json({ message: 'title and projectId are required' });
    }

    const { role, project } = await getProjectRole(projectId, req.user._id);
    if (!PROJECT_WRITE_ROLES.includes(role)) {
      return res.status(403).json({ message: 'Access denied. Contributor or above required.' });
    }

    // Validate assignee is a project/space member
    if (assignee) {
      const { role: assigneeRole } = await getProjectRole(projectId, assignee);
      if (!assigneeRole) {
        return res.status(400).json({ message: 'Assignee must be a project member' });
      }
    }

    // Validate status is a valid column key (or default to first column)
    const validKeys = project.boardColumns.map((c) => c.key);
    const taskStatus = status && validKeys.includes(status)
      ? status
      : (validKeys[0] || 'todo');

    const task = await Task.create({
      title,
      description: description || '',
      status: taskStatus,
      projectId,
      assignee: assignee || null,
      createdBy: req.user._id
    });

    project.tasks.push(task._id);
    await project.save();

    await logHistory('task', task._id, 'created', req.user._id, { title, projectId, assignee });

    const populatedTask = await populateTask(Task.findById(task._id));

    const io = getIO(req);
    if (io) {
      const spaceId = project.spaceId;
      io.to(`space-${spaceId}`).emit('task-created', populatedTask);
      io.to(`project-${projectId}`).emit('task-created', populatedTask);
    }

    res.status(201).json(populatedTask);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Update ───────────────────────────────────────────────────────────────────

module.exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('projectId');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const { role, project } = await getProjectRole(task.projectId._id, req.user._id);
    if (!PROJECT_WRITE_ROLES.includes(role)) {
      return res.status(403).json({ message: 'Access denied. Contributor or above required.' });
    }

    const { title, description, status, assignee } = req.body;
    const oldStatus   = task.status;
    const oldAssignee = task.assignee?.toString() ?? null;

    if (title)                   task.title = title;
    if (description !== undefined) task.description = description;

    if (status) {
      const validKeys = project.boardColumns.map((c) => c.key);
      if (!validKeys.includes(status)) {
        return res.status(400).json({
          message: `Invalid status. Valid values: ${validKeys.join(', ')}`
        });
      }
      task.status = status;
    }

    if (assignee !== undefined) {
      if (assignee === null) {
        task.assignee = null;
      } else {
        const { role: assigneeRole } = await getProjectRole(task.projectId._id, assignee);
        if (!assigneeRole) {
          return res.status(400).json({ message: 'Assignee must be a project member' });
        }
        task.assignee = assignee;
      }
    }

    await task.save();

    if (status && status !== oldStatus) {
      await logHistory('task', task._id, 'moved', req.user._id, { oldStatus, newStatus: status });
    }
    if (assignee !== undefined && assignee !== oldAssignee) {
      await logHistory('task', task._id, 'assigned', req.user._id, { oldAssignee, newAssignee: assignee });
    }
    if (title || description !== undefined) {
      await logHistory('task', task._id, 'updated', req.user._id, { title, description });
    }

    const populatedTask = await populateTask(Task.findById(task._id));

    const io = getIO(req);
    if (io) {
      const spaceId = project.spaceId;
      io.to(`space-${spaceId}`).emit('task-updated', populatedTask);
      io.to(`project-${task.projectId._id}`).emit('task-updated', populatedTask);
    }

    res.json(populatedTask);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Delete ───────────────────────────────────────────────────────────────────

module.exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('projectId');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const { role, project } = await getProjectRole(task.projectId._id, req.user._id);
    if (!PROJECT_WRITE_ROLES.includes(role)) {
      return res.status(403).json({ message: 'Access denied. Contributor or above required.' });
    }

    project.tasks = project.tasks.filter((t) => t.toString() !== task._id.toString());
    await project.save();

    await logHistory('task', task._id, 'deleted', req.user._id, { title: task.title });

    const io = getIO(req);
    if (io) {
      const spaceId = project.spaceId;
      io.to(`space-${spaceId}`).emit('task-deleted', { taskId: task._id, projectId: task.projectId._id });
      io.to(`project-${task.projectId._id}`).emit('task-deleted', { taskId: task._id, projectId: task.projectId._id });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
