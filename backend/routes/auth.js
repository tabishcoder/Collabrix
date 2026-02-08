const express = require('express');
const router = express.Router();

const { 
    registerUser, 
    loginUser, 
    refreshToken, 
    verifyOtp, 
    resendOtp,
    logoutUser,
    requestPasswordReset,
    resetPassword
} = require('../controller/auth');

const { auth } = require('../middleware/auth');

// @desc Register a new user
// @route POST /api/auth/register
// @access Public
router.post('/register', registerUser);

// @desc Login user with email and password
// @route POST /api/auth/login
// @access Public
router.post('/login', loginUser);

// @desc Logout user and clear cookies
// @route POST /api/auth/logout
// @access Private
router.post('/logout', auth, logoutUser);

// @desc Refresh access token
// @route POST /api/auth/refresh
// @access Private
router.post('/refresh', refreshToken);

// @desc Verify OTP for email verification or password reset
// @route POST /api/auth/verify-otp
// @access Public
router.post('/verify-otp', verifyOtp);

// @desc Resend OTP for email verification
// @route POST /api/auth/resend-otp
// @access Public
router.post('/resend-otp', resendOtp);

// @desc Request OTP for password reset
// @route POST /api/auth/request-reset-password
// @access Public
router.post('/request-reset-password', requestPasswordReset);

// @desc Reset password using reset token
// @route POST /api/auth/reset-password
// @access Public
router.post('/reset-password', resetPassword);

module.exports = router;
