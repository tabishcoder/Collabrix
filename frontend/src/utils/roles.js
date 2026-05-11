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

/** Collabrix platform operator (separate from workspace roles). */
export const isPlatformAdmin = (user) => (user?.role || "member") === "admin";

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
      return 'bg-purple-100 border-purple-200 text-purple-900 dark:bg-purple-500/15 dark:border-purple-500/30 dark:text-purple-200';
    case 'admin':
      return 'bg-blue-100 border-blue-200 text-blue-900 dark:bg-blue-500/15 dark:border-blue-500/30 dark:text-blue-200';
    case 'member':
      return 'bg-slate-100 border-slate-200 text-slate-700 dark:bg-white/5 dark:border-white/10 dark:text-white/55';
    default:
      return 'bg-slate-100 border-slate-200 text-slate-700 dark:bg-white/5 dark:border-white/10 dark:text-white/60';
  }
};

/** Tailwind classes for a compact project-role pill (D1). */
export const projectRoleBadgeClass = (role) => {
  switch (role) {
    case 'owner':
      return 'bg-purple-100 border-purple-200 text-purple-900 dark:bg-purple-500/15 dark:border-purple-500/30 dark:text-purple-200';
    case 'admin':
      return 'bg-blue-100 border-blue-200 text-blue-900 dark:bg-blue-500/15 dark:border-blue-500/30 dark:text-blue-200';
    case 'manager':
      return 'bg-emerald-100 border-emerald-200 text-emerald-900 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-200';
    case 'contributor':
      return 'bg-amber-100 border-amber-200 text-amber-900 dark:bg-amber-500/12 dark:border-amber-500/25 dark:text-amber-100/90';
    case 'viewer':
      return 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-white/5 dark:border-white/10 dark:text-white/50';
    default:
      return 'bg-slate-100 border-slate-200 text-slate-700 dark:bg-white/5 dark:border-white/10 dark:text-white/60';
  }
};
