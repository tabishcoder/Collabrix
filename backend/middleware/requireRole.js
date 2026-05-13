/**
 * Factory: require authenticated user whose platform `role` is one of `allowedRoles`.
 * Must run after `auth` / `requireAuth`.
 * @param {string[]} allowedRoles e.g. ['admin']
 */
module.exports = function requireRole(allowedRoles) {
  return (req, res, next) => {
    const role = req.user?.role || 'member';
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ message: 'Administrator access required.' });
    }
    next();
  };
};
