
const User = require('../models/User');
const Token = require('../models/Token');
const Verification = require('../models/Verification.js');
const { sendEmail, generateOTP, hashOTP } = require('../utils/email.js');
// const { generateOTP } = require('../utils/generateOTP.js');
const JWTService = require('../services/JWTService');

const crypto = require('crypto')
// const bcrypt = require('bcrypt')

const settings = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
}

const OTP_TTL_MS = process.env.OTP_TTL_MS || 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = process.env.RESEND_COOLDOWN_MS || 60 * 1000;
const MAX_RESENDS_PER_HOUR = process.env.MAX_RESENDS_PER_HOUR || 3;
const MAX_ATTEMPTS = process.env.MAX_ATTEMPTS || 5;

// @desc register new users on platform
// @route POST /api/auth/register
// @access Public
module.exports.registerUser = async (req, res) => {
    try {
        console.time('User Registration Time Started');
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
            console.time('User Creation Time');
            user = await User.create({ name, email, passwordHash: password });
            console.timeEnd('User Creation Time Ended With password Hashing');
        }

        // Create verification record
        console.time('OTP Generation Time');
        const otp = generateOTP();
        const otpHash = hashOTP(otp);
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + OTP_TTL_MS / 1000);
        console.timeEnd('OTP Generation Time Ended after hashing');

        // Remove any existing verifications for this user
        await Verification.deleteMany({ userId: user._id });

        const verification = await Verification.create({
            userId: user._id,
            otpHash,
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
            console.time('Email Send Time');
            await sendEmail(user.email, otp);
            console.timeEnd('Email Send Time Ended');
        } catch (err) {
            // cleanup
            await Verification.deleteOne({ _id: verification._id });

            // if user was just created (not previously existing unverified), delete user to avoid deadlock
            if (!existing) {
                await User.deleteOne({ _id: user._id });
            } else {
                // reset user's verification meta if existing user
                await User.findByIdAndUpdate(user._id, {meta : null});            
            }

            console.error('Email send failed', err);
            return res.status(500).json({ message: 'Failed to send verification email. Please try again later.' });
        }

        console.timeEnd('User Registration Time Ended -- Successful');
        return res.status(201).json({ message: 'User registered. OTP sent to email', userId: user._id });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// @desc log in existing user
// @route POST /api/auth/login
// @access Public
module.exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) return res.status(400).json({ msg: "Missing fields" });

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

        const isMatch = await user.matchPassword(password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

        if (!user.isVerified) return res.status(403).json({ message: 'Email not verified' });

        const accessToken = JWTService.signAccessToken({ _id: user._id });
        const refreshToken = JWTService.signRefreshToken({ _id: user._id });

        JWTService.storeRefreshToken(refreshToken, user._id);

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
            message: "Logged in Successfully"
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc Update the tokens
// @route POST /api/auth/refresh
// @access Private
module.exports.refreshToken = async (req, res) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
        res.status(402);
        throw new Error('No refresh token provided.');
    }

    let decoded = JWTService.verifyRefreshToken(refreshToken);

    // match with the DB stored token
    const storedToken = await Token.findOne({ userId: decoded._id, token: refreshToken });

    if (!storedToken) {
        // Clear cookie if token is invalid or expired
        res.clearCookie('refreshToken');
        res.status(403);
        throw new Error('Invalid or expired refresh token.');
    }

    const newAccessToken = JWTService.signAccessToken({ _id: decoded._id });

    res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
    });

    res.status(200).json({ message: 'Access token refreshed' });
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

        // if expired system will automatically remove from DB
        // if (verification.expiresAt < new Date()) {
        //     await Verification.deleteOne({ _id: verification._id });
        //     return res.status(400).json({ message: 'OTP expired. Request a new one.' });
        // }

        const otpHash = hashOTP(otp);
        if (otpHash !== verification.otpHash) {
            verification.attempts += 1;
            await verification.save();
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Successful verification
        await User.findByIdAndUpdate(userId, { isVerified: true, meta: null }); // also reset the OTP send count
        await Verification.deleteOne({ _id: verification._id });

        return res.json({ message: 'Email verified successfully' });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Verification failed' });
    }
};

// @desc Resend the OTP
// @route POST /api/auth/resend-otp
// @access Private
module.exports.resendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email required" });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.isVerified)
            return res.status(400).json({ message: "User already verified" });

        const now = Date.now();        
        const OTP_TTL_MS = 5 * 60 * 1000;             // 5 minutes

        // Extract unified meta
        const meta = user.meta || {};

        // Initialize hour window start if empty
        if (!meta.hourWindowStart) meta.hourWindowStart = now;

        // Enforce cooldown
        if (meta.lastSentAt && now - meta.lastSentAt < RESEND_COOLDOWN_MS) {
            return res
                .status(429)
                .json({ message: "Please wait before requesting a new OTP." });
        }

        // Reset hourly window if needed
        if (now - meta.hourWindowStart >= 3600000) {
            meta.hourWindowStart = now;
            meta.resendCount = 0;
        }

        // Enforce hourly rate limit
        if (meta.resendCount >= MAX_RESENDS_PER_HOUR) {
            return res
                .status(429)
                .json({ message: "Too many OTP requests this hour. Try again later." });
        }

        // Delete previous verification doc if it exists (optional but clean)
        await Verification.deleteMany({
            userId: user._id,
            type: "email_verification"
        });

        // Generate new OTP
        const otp = generateOTP();
        const otpHash = hashOTP(otp);

        // Create fresh verification doc
        await Verification.create({
            userId: user._id,
            otpHash,
            type: "email_verification",
            expiresAt: new Date(now + OTP_TTL_MS),
            attempts: 0
        });

        // Update meta rate-limit counters
        meta.resendCount = (meta.resendCount || 0) + 1;
        meta.lastSentAt = now;
        user.meta = meta;

        await user.save();

        // Send the email
        await sendEmail(user.email, otp);
        // console.log("Mock Email Send");

        return res.json({ message: "OTP sent" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to resend OTP" });
    }
};


