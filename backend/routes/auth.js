const express = require('express');
const router = express.Router();

const { 
    registerUser, 
    loginUser, 
    refreshToken, 
    verifyOtp, 
    resendOtp,
    logoutUser
} = require('../controller/auth');

const { auth } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', registerUser);

// POST /api/auth/login
router.post('/login', loginUser);

// POST /api/auth/logout
router.post('/logout', auth, logoutUser);

// POST /api/auth/refresh
router.post('/refresh', refreshToken);

// POST /api/auth/verify-otp
router.post('/verify-otp', verifyOtp);

// POST /api/auth/resend-otp
router.post('/resend-otp', resendOtp);

module.exports = router;
