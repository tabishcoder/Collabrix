/**
 * Centralised RBAC lookup helpers.
 * All functions return { role, <entity> } rather than a boolean so callers
 * can both gate and attach the entity to the request without a second query.
 */

const Space   = require('../models/Space');
const Project = require('../models/Project');

// ─── Space ──────────────────────────────────────────────────────────────────

/**
 * Returns the authenticated user's role in a workspace.
 * 'owner' | 'admin' | 'member' | null
 */
const getSpaceRole = async (spaceId, userId) => {
  const space = await Space.findById(spaceId);
  if (!space) return { role: null, space: null };

  if (space.owner.toString() === userId.toString()) {
    return { role: 'owner', space };
  }

  const membership = space.members.find(
    (m) => m.user.toString() === userId.toString()
  );
  return { role: membership?.role ?? null, space };
};

/**
 * True if the user is owner, admin, or member of the space.
 */
const isSpaceAccess = (role) => role !== null;

// ─── Project ─────────────────────────────────────────────────────────────────

/**
 * Returns the user's effective role in a project.
 * Space owners + admins always get full 'manager' rights inside projects.
 * Returns: 'owner' | 'admin' | 'manager' | 'contributor' | 'viewer' | null
 */
const getProjectRole = async (projectId, userId) => {
  const project = await Project.findById(projectId).populate('spaceId');
  if (!project) return { role: null, project: null, space: null };

  const space = project.spaceId;
  if (!space) return { role: null, project, space: null };

  // Space owner gets implicit owner rights across all projects
  if (space.owner.toString() === userId.toString()) {
    return { role: 'owner', project, space };
  }

  // Space admins get implicit manager rights in every project
  const spaceMembership = space.members.find(
    (m) => m.user.toString() === userId.toString()
  );
  if (spaceMembership?.role === 'admin') {
    return { role: 'admin', project, space };
  }

  // Check explicit project membership
  const projectMembership = project.members.find(
    (m) => m.user.toString() === userId.toString()
  );
  if (projectMembership) {
    return { role: projectMembership.role, project, space };
  }

  return { role: null, project, space };
};

// ─── Convenience checks ──────────────────────────────────────────────────────

/**
 * Workspace roles that count as "owner or admin" (can manage the workspace).
 */
const SPACE_ADMIN_ROLES = ['owner', 'admin'];

/**
 * Roles that can write tasks (manager, contributor) or have higher space rights.
 */
const PROJECT_WRITE_ROLES = ['owner', 'admin', 'manager', 'contributor'];

/**
 * Roles that can edit board structure / manage project members.
 */
const PROJECT_MANAGE_ROLES = ['owner', 'admin', 'manager'];

module.exports = {
  getSpaceRole,
  getProjectRole,
  isSpaceAccess,
  SPACE_ADMIN_ROLES,
  PROJECT_WRITE_ROLES,
  PROJECT_MANAGE_ROLES
};
