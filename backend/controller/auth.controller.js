
const User = require('../models/User');
const Token = require('../models/Token');
const Verification = require('../models/Verification.js');
const { sendEmail, generateOTP, hashOTP } = require('../utils/email.js');
const JWTService = require('../services/JWTService');

// const bcrypt = require('bcrypt')

const settings = {
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.SAME_SITE || 'lax',
};

const OTP_TTL_MS = process.env.OTP_TTL_MS || 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = process.env.RESEND_COOLDOWN_MS || 60 * 1000;
const MAX_RESENDS_PER_HOUR = process.env.MAX_RESENDS_PER_HOUR || 3;
const MAX_ATTEMPTS = process.env.MAX_ATTEMPTS || 5;

// @desc register new users on platform
// @route POST /api/auth/register
// @access Public
module.exports.registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ message: 'Missing essential fields' });

        const existing = await User.findOne({ email });
        if (existing && existing.isVerified) return res.status(400).json({ message: 'Email already in use' });

        // If unverified user exists, reuse it; else create
        let user;
        if (existing && !existing.isVerified) {
            user = existing;
            user.name = name;
            user.passwordHash = password;        // will be automatically hashed once updation detects
            await user.save();
        } else {
            // The salt generation and password matching will be handled in User model
            user = await User.create({ name, email, passwordHash: password });
        }

        // Create verification record
        const otp = generateOTP();
        const otpHash = hashOTP(otp);
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + OTP_TTL_MS / 1000);

        // Remove any existing verifications for this user
        await Verification.deleteMany({ userId: user._id });

        const verification = await Verification.create({
            userId: user._id,
            otpHash,
            expiresAt,
            type: 'email_verification'
        });

        await User.findByIdAndUpdate(user._id, {
            meta: {
                resendCount: 0,
                lastSentAt: new Date(),
                hourWindowStart: new Date()
            }
        })

        // // Send email — if it fails, clean up verification and possibly user
        try {
            await sendEmail(user.email, otp);
        } catch (err) {
            // cleanup
            await Verification.deleteOne({ _id: verification._id });

            // if user was just created (not previously existing unverified), delete user to avoid deadlock
            if (!existing) {
                await User.deleteOne({ _id: user._id });
            } else {
                // reset user's verification meta if existing user
                await User.findByIdAndUpdate(user._id, { meta: null });
            }

            console.error('Email send failed', err?.message);
            return res.status(500).json({ message: 'Failed to send verification email. Please try again later.' });
        }

        return res.status(201).json({ message: 'User registered. OTP sent to email', userId: user._id });

    } catch (err) {
        console.error(err?.message);
        res.status(500).json({ error: err.message });
    }
}

// @desc log in existing user
// @route POST /api/auth/login
// @access Public
module.exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ msg: "Missing fields" });

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

        const isMatch = await user.matchPassword(password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

        if (user.isActive === false) {
            return res.status(403).json({ message: 'Account has been deactivated. Contact an administrator.' });
        }

        if (!user.isVerified) return res.status(403).json({ message: 'Email not verified' });

        const accessToken = JWTService.signAccessToken({ _id: user._id });
        const refreshToken = JWTService.signRefreshToken({ _id: user._id });

        JWTService.storeRefreshToken(refreshToken, user._id);

        await User.findByIdAndUpdate(user._id, { $set: { lastLoginAt: new Date() } });

        res.cookie('accessToken', accessToken, {
            ...settings,
            maxAge: 1000 * 60 * 30  // 30 mins
        })

        res.cookie('refreshToken', refreshToken, {
            ...settings,
            maxAge: 1000 * 60 * 60 * 24 * 7  // 7 days
        })

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role || 'member',
            message: "Logged in Successfully",
            // Also returned for SPAs on a different origin than the API (cookies may not attach on XHR).
            accessToken,
            refreshToken,
        });
    } catch (err) {
        console.error(err?.message);
        res.status(500).json({ error: err.message });
    }
};

// @desc log out user
// @route POST /api/auth/logout
// @access Private
module.exports.logoutUser = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (refreshToken) {
            // delete only if exists
            await Token.deleteOne({ token: refreshToken, userId: req.user._id }).catch(() => { });
        }

        res.clearCookie("accessToken", settings);
        res.clearCookie("refreshToken", settings);

        return res.status(200).json({ message: "Logged out successfully", clearedTokens: true });

    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({ message: "Logout failed" });
    }
};

// @desc Update the tokens
// @route POST /api/auth/refresh
// @access Private
module.exports.refreshToken = async (req, res) => {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
        return res.status(402).json({ message: 'No refresh token provided.' });
    }

    let decoded = JWTService.verifyRefreshToken(refreshToken);

    // match with the DB stored token
    const storedToken = await Token.findOne({ userId: decoded._id, token: refreshToken });

    if (!storedToken) {
        // Clear cookie if token is invalid or expired
        res.clearCookie('refreshToken', { path: '/', ...settings });
        return res.status(403).json({ message: 'Refresh token invalid or expired. Please log in again.' });
    }

    const refreshUser = await User.findById(decoded._id).select('isActive');
    if (refreshUser && refreshUser.isActive === false) {
        res.clearCookie('refreshToken', { path: '/', ...settings });
        res.clearCookie('accessToken', { path: '/', ...settings });
        return res.status(403).json({ message: 'Account has been deactivated. Please sign in again.' });
    }

    const newAccessToken = JWTService.signAccessToken({ _id: decoded._id });

    res.cookie('accessToken', newAccessToken, {
        ...settings,
        maxAge: 15 * 60 * 1000,
    });

    return res.status(200).json({
        message: 'Access token refreshed',
        accessToken: newAccessToken,
    });
}

// @desc Verify the OTP
// @route POST /api/auth/verify-otp
// @access Private
module.exports.verifyOtp = async (req, res) => {
    try {
        const { userId, otp } = req.body;
        if (!userId || !otp) return res.status(400).json({ message: 'Missing fields' });

        const verification = await Verification.findOne({ userId });
        if (!verification) return res.status(400).json({ message: 'OTP expired or verification failed. Request new OTP.' });

        if (verification.attempts >= MAX_ATTEMPTS) {
            await Verification.deleteOne({ _id: verification._id });
            return res.status(429).json({ message: 'Too many incorrect attempts. Request a new OTP.' });
        }

        const otpHash = hashOTP(otp);
        if (otpHash !== verification.otpHash) {
            verification.attempts += 1;
            await verification.save();
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // ------------- SUCCESS CASES -------------
        if (verification.type === "email_verification") {
            await User.findByIdAndUpdate(userId, {
                isVerified: true,
                meta: null
            });

            await Verification.deleteOne({ _id: verification._id });

            return res.json({
                success: true,
                type: "email_verification",
                next: "dashboard",
                message: "Email verified successfully"
            });
        }

        if (verification.type === "password_reset") {
            await Verification.deleteOne({ _id: verification._id });

            const resetToken = JWTService.signResetToken({ userId: verification.userId });

            return res.json({
                success: true,
                type: "password_reset",
                next: "reset_password",
                resetToken,
                message: "OTP verified. You may reset your password."
            });
        }


        // Successful verification
        await User.findByIdAndUpdate(userId, { isVerified: true, meta: null }); // also reset the OTP send count
        await Verification.deleteOne({ _id: verification._id });

        return res.json({ message: 'Email verified successfully' });

    } catch (err) {
        console.error(err?.message);
        return res.status(500).json({ message: 'Verification failed' });
    }
};

// @desc Resend the OTP
// @route POST /api/auth/resend-otp
// @access Private
module.exports.resendOtp = async (req, res) => {
    try {
        const { userId, type } = req.body;

        if (!userId || !type) {
            return res.status(400).json({ message: "userId and type required" });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (type === "email_verification" && user.isVerified) {
            return res.status(400).json({ message: "User already verified" });
        }

        const now = Date.now();
        const OTP_TTL_MS = 5 * 60 * 1000;

        const meta = user.meta || {};

        if (!meta.hourWindowStart) meta.hourWindowStart = now;

        if (meta.lastSentAt && now - meta.lastSentAt < RESEND_COOLDOWN_MS) {
            return res
                .status(429)
                .json({ message: "Please wait before requesting a new OTP." });
        }

        if (now - meta.hourWindowStart >= 3600000) {
            meta.hourWindowStart = now;
            meta.resendCount = 0;
        }

        if ((meta.resendCount || 0) >= MAX_RESENDS_PER_HOUR) {
            return res
                .status(429)
                .json({ message: "Too many OTP requests. Try again later." });
        }

        await Verification.deleteMany({
            userId: user._id,
            type,
        });

        const otp = generateOTP();
        const otpHash = hashOTP(otp);

        await Verification.create({
            userId: user._id,
            otpHash,
            type,
            expiresAt: new Date(now + OTP_TTL_MS),
            attempts: 0,
        });

        meta.resendCount = (meta.resendCount || 0) + 1;
        meta.lastSentAt = now;

        user.meta = meta;
        await user.save();

        await sendEmail(user.email, otp);

        return res.json({ message: "OTP sent" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to resend OTP" });
    }
};

// --------------------- Password Recovery Routes -------------------

// @desc Receive request for password reset
// @route POST /api/auth/request-reset-password
// @access Public
module.exports.requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email required" });

        const user = await User.findOne({ email });
        if (!user)
            return res.status(200).json({ message: "If the email exists, an OTP has been sent" }); // avoid email enumeration

        await Verification.deleteMany({
            userId: user._id,
            type: "password_reset"
        });

        const otp = generateOTP();
        const otpHash = hashOTP(otp);

        await Verification.create({
            userId: user._id,
            otpHash,
            type: "password_reset",
            expiresAt: new Date(Date.now() + 5 * 60 * 1000)
        });

        await sendEmail(user.email, otp);

        return res.json({ userId: user._id, message: "OTP sent for password reset" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to send OTP" });
    }
};

// @desc Reset password using OTP
// @route POST /api/auth/reset-password
// @access Public
module.exports.resetPassword = async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;
        if (!resetToken || !newPassword)
            return res.status(400).json({ message: "Missing fields" });

        let payload;
        try {
            payload = JWTService.verifyResetToken(resetToken);
        } catch {
            return res.status(401).json({ message: "Invalid or expired token" });
        }

        const user = await User.findById(payload.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // automatically hashed in model pre-save hook
        user.passwordHash = newPassword;
        await user.save();

        return res.json({ message: "Password reset successful" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to reset password" });
    }
};