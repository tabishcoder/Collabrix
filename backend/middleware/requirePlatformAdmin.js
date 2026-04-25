/**
 * Requires authenticated user with platformRole === 'admin'.
 * Must run after `auth` middleware.
 */
module.exports = function requirePlatformAdmin(req, res, next) {
  const role = req.user?.platformRole || 'user';
  if (role !== 'admin') {
    return res.status(403).json({ message: 'Platform administrator access required.' });
  }
  next();
};
