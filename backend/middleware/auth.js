const JWTService = require('../services/JWTService')
const User = require('../models/User')

function bearerFromHeader(req) {
  const h = req.headers.authorization;
  if (!h || typeof h !== 'string') return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

module.exports.auth = async (req, res, next) => {
  try {
    const accessToken = req.cookies?.accessToken || bearerFromHeader(req);

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
    req.user = await User.findById(decoded._id).select('-passwordHash');

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
