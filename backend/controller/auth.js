
const User = require('../models/User');
const Token = require('../models/Token');
const JWTService = require('../services/JWTService');

const settings = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
}

// @desc register new users on platform
// @route /api/auth/register
// @access Public
module.exports.registerUser = async (req, res) => {
    const { name, email, password: passwordHash } = req.body;
    try {
        if (await User.findOne({ email })) return res.status(400).json({ msg: 'Email already used' });

        // The salt generation and password matching will be handled in User model
        const user = await User.create({ name, email, passwordHash });

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
            message: "User Registered Successfully"
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// @desc log in existing user
// @route /api/auth/login
// @access Public
module.exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

        const isMatch = await user.matchPassword(password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

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
            message: "Login Successfully"
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc Update the tokens
// @route /api/auth/refresh
// @access Private
// @method POST
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