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
        className={`flex h-9 items-center gap-1.5 rounded-md border px-2 text-[var(--color-text-secondary)] shadow-sm transition-colors duration-150 sm:gap-2 sm:px-2.5 ${
          open
            ? "border-[var(--color-border-strong)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)]"
            : "border-[var(--color-border-strong)] bg-[var(--color-card)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
        }`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Theme: ${active.label}. Resolved: ${resolvedTheme} mode.`}
      >
        <ActiveIcon className="text-[13px] opacity-90" aria-hidden />
        <span className="hidden max-w-[5rem] truncate text-[13px] sm:inline">{active.label}</span>
        <FaChevronDown
          className={`text-[9px] text-[var(--color-text-muted)] transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          className="absolute right-0 z-[200] mt-1.5 w-40 overflow-hidden rounded-md border border-[var(--color-border-strong)] bg-[var(--color-dropdown-bg)] py-0.5 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.05]"
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
                  className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[13px] transition-colors duration-150 ${
                    selected
                      ? "bg-[var(--color-surface-hover)] text-[var(--color-text-primary)]"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  <Icon className="text-xs opacity-80" />
                  {label}
                  {value === "system" && preference === "system" && (
                    <span className="ml-auto text-[10px] capitalize text-[var(--color-text-muted)]">{resolvedTheme}</span>
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
