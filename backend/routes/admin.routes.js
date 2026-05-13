const express = require('express');
const router = express.Router();

const { auth } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const {
  getAdminOverview,
  getSystemStats,
  getAllUsers,
  updateAdminUser,
  getAllWorkspaces,
  getWorkspaceById,
  getAnalyticsData,
} = require('../controller/admin.controller');

const adminChain = [auth, requireRole(['admin'])];

router.get('/overview', ...adminChain, getAdminOverview);
router.get('/stats', ...adminChain, getSystemStats);
router.get('/users', ...adminChain, getAllUsers);
router.patch('/users/:id', ...adminChain, updateAdminUser);
router.get('/workspaces', ...adminChain, getAllWorkspaces);
router.get('/workspaces/:id', ...adminChain, getWorkspaceById);
router.get('/analytics', ...adminChain, getAnalyticsData);

module.exports = router;
