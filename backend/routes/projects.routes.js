const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getProjectsBySpace,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember
} = require('../controller/projects.controller');

// @desc Get all projects in a space
// @route GET /api/projects/space/:spaceId
// @access Private
router.get('/space/:spaceId', auth, getProjectsBySpace);

// @desc Get a specific project by ID
// @route GET /api/projects/:id
// @access Private
router.get('/:id', auth, getProjectById);

// @desc Create a new project
// @route POST /api/projects
// @access Private
router.post('/', auth, createProject);

// @desc Update project details
// @route PUT /api/projects/:id
// @access Private
router.put('/:id', auth, updateProject);

// @desc Delete a project
// @route DELETE /api/projects/:id
// @access Private
router.delete('/:id', auth, deleteProject);

// @desc Add member to project
// @route POST /api/projects/:id/members
// @access Private
router.post('/:id/members', auth, addProjectMember);

// @desc Remove member from project
// @route DELETE /api/projects/:id/members/:userId
// @access Private
router.delete('/:id/members/:userId', auth, removeProjectMember);

module.exports = router;
