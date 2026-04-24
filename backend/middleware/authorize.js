/**
 * Route-level authorization middleware factories.
 *
 * Usage (in route files):
 *   const { requireSpaceRole, requireProjectRole } = require('../middleware/authorize');
 *
 *   // Only workspace owner or admin:
 *   router.post('/:id/invite', auth, requireSpaceRole(['owner','admin']), handler);
 *
 *   // Any project write role:
 *   router.put('/tasks/:id', auth, requireProjectRole(['owner','admin','manager','contributor']), handler);
 *
 * After the middleware runs, the following are attached to req:
 *   req.spaceRole, req.space       (for requireSpaceRole)
 *   req.projectRole, req.project, req.space  (for requireProjectRole)
 */

const { getSpaceRole, getProjectRole } = require('../utils/rbac');

// ─── Space ────────────────────────────────────────────────────────────────────

module.exports.requireSpaceRole = (allowedRoles) => async (req, res, next) => {
  try {
    const spaceId = req.params.id || req.params.spaceId || req.body.spaceId;
    if (!spaceId) return res.status(400).json({ message: 'Space ID required' });

    const { role, space } = await getSpaceRole(spaceId, req.user._id);

    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }

    req.spaceRole = role;
    req.space = space;
    return next();
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── Project ──────────────────────────────────────────────────────────────────

module.exports.requireProjectRole = (allowedRoles) => async (req, res, next) => {
  try {
    const projectId = req.params.id || req.params.projectId;
    if (!projectId) return res.status(400).json({ message: 'Project ID required' });

    const { role, project, space } = await getProjectRole(projectId, req.user._id);

    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }

    req.projectRole = role;
    req.project = project;
    req.space = space;
    return next();
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
