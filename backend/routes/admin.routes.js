const express = require('express');
const router = express.Router();

const { auth } = require('../middleware/auth');
const requirePlatformAdmin = require('../middleware/requirePlatformAdmin');
const { getAdminOverview } = require('../controller/admin.controller');

router.get('/overview', auth, requirePlatformAdmin, getAdminOverview);

module.exports = router;
