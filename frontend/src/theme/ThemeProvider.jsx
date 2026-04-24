import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  THEME_STORAGE_KEY,
  normalizePreference,
  resolveTheme,
  applyResolvedTheme,
  readSystemDark,
} from "./themeConstants";

/** @typedef {import('./themeConstants').ThemePreference} ThemePreference */

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [preference, setPreferenceState] = useState(() => {
    if (typeof window === "undefined") return "system";
    return normalizePreference(localStorage.getItem(THEME_STORAGE_KEY));
  });

  const resolvedTheme = useMemo(
    () => resolveTheme(preference),
    [preference],
  );

  const setPreference = useCallback((next) => {
    const normalized = normalizePreference(next);
    setPreferenceState(normalized);
    try {
      if (normalized === "system") {
        localStorage.removeItem(THEME_STORAGE_KEY);
      } else {
        localStorage.setItem(THEME_STORAGE_KEY, normalized);
      }
    } catch {
      /* ignore quota / private mode */
    }
    applyResolvedTheme(resolveTheme(normalized));
  }, []);

  useEffect(() => {
    applyResolvedTheme(resolveTheme(preference));
  }, [preference]);

  useEffect(() => {
    if (preference !== "system") return undefined;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      applyResolvedTheme(readSystemDark() ? "dark" : "light");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [preference]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== THEME_STORAGE_KEY) return;
      setPreferenceState(normalizePreference(e.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo(
    () => ({
      preference,
      resolvedTheme,
      setPreference,
    }),
    [preference, resolvedTheme, setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
