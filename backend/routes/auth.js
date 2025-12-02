const express = require('express');
const router = express.Router();

const { registerUser, loginUser, refreshToken } = require('../controller/auth');

// POST /api/auth/register
router.post('/register', registerUser);

// POST /api/auth/login
router.post('/login', loginUser);

// POST /api/auth/refresh
router.post('/refresh', refreshToken);

module.exports = router;
