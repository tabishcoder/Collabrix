const express = require('express');
const { auth } = require('../middleware/auth');
const router = express.Router();

const { getMe } = require('../controller/users.controller')

// @desc Get authenticated user profile
// @route GET /api/users/me
// @access Private
router.get('/me', auth, getMe);

module.exports = router;
