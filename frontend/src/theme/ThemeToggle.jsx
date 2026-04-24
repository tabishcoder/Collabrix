import { useEffect, useRef, useState } from "react";
import { FaChevronDown, FaDesktop, FaMoon, FaSun } from "react-icons/fa";
import { useTheme } from "./ThemeProvider";

const OPTIONS = [
  { value: "light", label: "Light", Icon: FaSun },
  { value: "dark", label: "Dark", Icon: FaMoon },
  { value: "system", label: "System", Icon: FaDesktop },
];

export default function ThemeToggle() {
  const { preference, resolvedTheme, setPreference } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const active = OPTIONS.find((o) => o.value === preference) ?? OPTIONS[2];
  const ActiveIcon = active.Icon;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface-muted)] px-2.5 py-2 text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Theme: ${active.label}. Resolved: ${resolvedTheme} mode.`}
      >
        <ActiveIcon className="text-xs" aria-hidden />
        <span className="hidden sm:inline max-w-[5.5rem] truncate">
          {active.label}
        </span>
        <FaChevronDown
          className={`text-[10px] opacity-60 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          className="absolute right-0 z-[60] mt-2 w-44 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-dropdown-bg)] py-1 shadow-lg ring-1 ring-black/5 dark:ring-white/10"
          role="listbox"
        >
          {OPTIONS.map(({ value, label, Icon }) => {
            const selected = preference === value;
            return (
              <li key={value} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    setPreference(value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition ${
                    selected
                      ? "bg-[var(--color-surface-hover)] text-[var(--color-text-primary)]"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  <Icon className="text-xs opacity-80" />
                  {label}
                  {value === "system" && preference === "system" && (
                    <span className="ml-auto text-[10px] text-[var(--color-text-muted)]">
                      {resolvedTheme}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
