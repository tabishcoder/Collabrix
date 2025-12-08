
const Token = require('../models/Token');
const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.ACCESS_TOKEN;
const REFRESH_SECRET = process.env.REFRESH_TOKEN;

class JWTService {
    // sign access token
    static signAccessToken(payload) {
        return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '30m' });
    }

    // sign refresh token
    static signRefreshToken(payload) {
        return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
    }

    // verify access token
    static verifyAccessToken(token) {
        return jwt.verify(token, ACCESS_SECRET);
    }

    // verify refresh token
    static verifyRefreshToken(token) {
        return jwt.verify(token, REFRESH_SECRET);
    }

    // store refresh token in database
    static async storeRefreshToken(token, userId) {
        try {
            await Token.deleteMany({userId});
            return await Token.create({token, userId});
        } catch (error) {
            return error;
        }
    }
}

module.exports = JWTService;