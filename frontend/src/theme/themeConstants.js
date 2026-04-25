/**
 * Theme persistence — keep in sync with the inline script in index.html
 * (FOUC prevention). Key and allowed values must match exactly.
 */
export const THEME_STORAGE_KEY = "collabrix-theme";

/** @typedef {'light' | 'dark' | 'system'} ThemePreference */

/** @type {ThemePreference[]} */
export const THEME_PREFERENCES = ["light", "dark", "system"];

/**
 * @param {string | null} raw
 * @returns {ThemePreference}
 */
export function normalizePreference(raw) {
  if (raw === "light" || raw === "dark" || raw === "system") return raw;
  return "system";
}

/** @returns {boolean} */
export function readSystemDark() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * @param {ThemePreference} preference
 * @returns {'light' | 'dark'}
 */
export function resolveTheme(preference) {
  if (preference === "system") return readSystemDark() ? "dark" : "light";
  return preference;
}

/**
 * Apply resolved theme to document (class + color-scheme).
 * @param {'light' | 'dark'} resolved
 */
export function applyResolvedTheme(resolved) {
  const root = document.documentElement;
  if (resolved === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  root.style.colorScheme = resolved;
}
