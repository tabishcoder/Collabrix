const JWTService = require('../services/JWTService')
const User = require('../models/User')

module.exports.auth = async (req, res, next) => {
  try {
    const { accessToken } = req.cookies;

    if (!accessToken) {
      res.status(401);
      throw new Error('Not authorized, no token');
    }
    const decoded = JWTService.verifyAccessToken(accessToken);
    if (!decoded) {
      res.status(401);
      throw new Error('Not authorized, token failed');
    }

    // Get user and attach to the request object
    req.user = await User.findById(decoded).select('-passwordHash');

    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized, user not found');
    }

    next();
  } catch (error) {
    console.error(error?.message);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};
