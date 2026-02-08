const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { 
  getSpaceHistory,
  getProjectHistory,
  getTaskHistory,
  getUserHistory
 } = require('../controller/history');

// @desc Get history for a space
// @route GET /api/history/space/:spaceId
// @access Private
router.get('/space/:spaceId', auth, getSpaceHistory);

// @desc Get history for a project
// @route GET /api/history/project/:projectId
// @access Private
router.get('/project/:projectId', auth, getProjectHistory);

// @desc Get history for a task
// @route GET /api/history/task/:taskId
// @access Private
router.get('/task/:taskId', auth, getTaskHistory);

// @desc Get history for a specific user (optional - for user activity)
// @route GET /api/history/user/:userId
// @access Private
router.get('/user/:userId', auth, getUserHistory);

module.exports = router;
