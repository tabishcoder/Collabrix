const express = require('express');
const router = express.Router();

const { registerUser, loginUser, refreshToken, verifyOtp, resendOtp } = require('../controller/auth');

// POST /api/auth/register
router.post('/register', registerUser);

// POST /api/auth/login
router.post('/login', loginUser);

// POST /api/auth/refresh
router.post('/refresh', refreshToken);

router.post('/verify-otp', verifyOtp);

router.post('/resend-otp', resendOtp);

module.exports = router;
