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

/** Tailwind classes for a compact workspace-role pill (D1). */
export const spaceRoleBadgeClass = (role) => {
  switch (role) {
    case 'owner':
      return 'bg-purple-500/15 border-purple-500/30 text-purple-200';
    case 'admin':
      return 'bg-blue-500/15 border-blue-500/30 text-blue-200';
    case 'member':
      return 'bg-white/5 border-white/10 text-white/55';
    default:
      return 'bg-white/5 border-white/10 text-white/60';
  }
};

/** Tailwind classes for a compact project-role pill (D1). */
export const projectRoleBadgeClass = (role) => {
  switch (role) {
    case 'owner':
      return 'bg-purple-500/15 border-purple-500/30 text-purple-200';
    case 'admin':
      return 'bg-blue-500/15 border-blue-500/30 text-blue-200';
    case 'manager':
      return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200';
    case 'contributor':
      return 'bg-amber-500/12 border-amber-500/25 text-amber-100/90';
    case 'viewer':
      return 'bg-white/5 border-white/10 text-white/50';
    default:
      return 'bg-white/5 border-white/10 text-white/60';
  }
};
