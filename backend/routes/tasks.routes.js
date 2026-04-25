const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getTasksByProject,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  addTaskComment,
} = require('../controller/tasks.controller');

// @desc Get all tasks in a project
// @route GET /api/tasks/project/:projectId
// @access Private
router.get('/project/:projectId', auth, getTasksByProject);

// @desc Add comment to task
// @route POST /api/tasks/:id/comments
// @access Private
router.post('/:id/comments', auth, addTaskComment);

// @desc Get a specific task by ID
// @route GET /api/tasks/:id
// @access Private
router.get('/:id', auth, getTaskById);

// @desc Create a new task
// @route POST /api/tasks
// @access Private
router.post('/', auth, createTask);

// @desc Update task details
// @route PUT /api/tasks/:id
// @access Private
router.put('/:id', auth, updateTask);

// @desc Delete a task
// @route DELETE /api/tasks/:id
// @access Private
router.delete('/:id', auth, deleteTask);

module.exports = router;
