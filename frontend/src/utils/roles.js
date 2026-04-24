/**
 * Frontend role constants and helpers.
 * The backend is the authoritative source; these are used purely
 * for showing/hiding UI elements (buttons, forms, menus).
 */

// Workspace roles that have administrative access
export const SPACE_ADMIN_ROLES = ['owner', 'admin'];

// Project roles that can manage board structure and members
export const PROJECT_MANAGE_ROLES = ['owner', 'admin', 'manager'];

// Project roles that can write tasks
export const PROJECT_WRITE_ROLES  = ['owner', 'admin', 'manager', 'contributor'];

/** Returns true if the given role can manage the workspace. */
export const canManageSpace = (role) => SPACE_ADMIN_ROLES.includes(role);

/** Returns true if the given role can manage board columns/members. */
export const canManageProject = (role) => PROJECT_MANAGE_ROLES.includes(role);

/** Returns true if the given role can create/edit tasks. */
export const canWriteTasks = (role) => PROJECT_WRITE_ROLES.includes(role);

/** Human-readable label for a workspace role. */
export const spaceRoleLabel = (role) => {
  const labels = { owner: 'Owner', admin: 'Admin', member: 'Member' };
  return labels[role] ?? role ?? '—';
};

/** Human-readable label for a project role. */
export const projectRoleLabel = (role) => {
  const labels = { manager: 'Manager', contributor: 'Contributor', viewer: 'Viewer' };
  return labels[role] ?? role ?? '—';
};
