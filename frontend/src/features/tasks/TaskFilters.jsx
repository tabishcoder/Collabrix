import { useMemo, useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { FaFilter } from "react-icons/fa";

export const PRIORITY_KEYS = ["none", "low", "medium", "high", "urgent"];

/** Default filter state: empty priorities = show all priorities */
export const defaultTaskFilters = () => ({
  search: "",
  assignee: "all", // 'all' | 'unassigned' | <userId>
  priorities: [], // subset of PRIORITY_KEYS; empty = all
  duePreset: "all", // 'all' | 'overdue' | 'this_week' | 'no_due'
});

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfISOWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfISOWeek(date) {
  const s = startOfISOWeek(date);
  const e = new Date(s);
  e.setDate(e.getDate() + 7);
  return e;
}

function dateOnlyMs(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

/**
 * Client-side filter on the loaded tasks array (E1).
 * @param {object[]} tasks
 * @param {ReturnType<defaultTaskFilters>} filters
 * @param {{ key: string }[]} columns - used to treat `done` column as non-overdue
 */
export function applyTaskFilters(tasks, filters, columns = []) {
  const doneKeys = new Set(
    (columns || []).filter((c) => /done/i.test(c.key) || /done/i.test(c.name || "")).map((c) => c.key),
  );
  if (!doneKeys.has("done")) doneKeys.add("done");

  let out = [...(tasks || [])];

  const q = (filters.search || "").trim().toLowerCase();
  if (q) {
    out = out.filter((t) => {
      const title = (t.title || "").toLowerCase();
      const desc = (t.description || "").toLowerCase();
      const labels = Array.isArray(t.labels) ? t.labels : [];
      return (
        title.includes(q) ||
        desc.includes(q) ||
        labels.some((l) => String(l).toLowerCase().includes(q))
      );
    });
  }

  if (filters.assignee === "unassigned") {
    out = out.filter((t) => !t.assignee?._id && !t.assignee);
  } else if (filters.assignee && filters.assignee !== "all") {
    const id = String(filters.assignee);
    out = out.filter((t) => String(t.assignee?._id ?? t.assignee ?? "") === id);
  }

  const pr = filters.priorities || [];
  if (pr.length > 0) {
    out = out.filter((t) => pr.includes(t.priority || "none"));
  }

  const due = filters.duePreset || "all";
  if (due === "no_due") {
    out = out.filter((t) => !t.dueDate);
  } else if (due === "overdue") {
    const today = startOfToday().getTime();
    out = out.filter((t) => {
      if (!t.dueDate) return false;
      if (doneKeys.has(t.status)) return false;
      return dateOnlyMs(t.dueDate) < today;
    });
  } else if (due === "this_week") {
    const now = new Date();
    const start = startOfISOWeek(now).getTime();
    const end = endOfISOWeek(now).getTime();
    out = out.filter((t) => {
      if (!t.dueDate) return false;
      const ms = new Date(t.dueDate).getTime();
      return ms >= start && ms < end;
    });
  }

  return out;
}

function activeFilterCount(filters) {
  let n = 0;
  if ((filters.search || "").trim()) n += 1;
  if (filters.assignee !== "all") n += 1;
  if ((filters.priorities || []).length > 0) n += 1;
  if (filters.duePreset !== "all") n += 1;
  return n;
}

/**
 * @param {{ filters: object; onChange: (f: object) => void; projectMembers?: object[]; projectId?: string }} props
 */
export default function TaskFilters({ filters, onChange, projectMembers = [], projectId }) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 16, width: 352 });
  const rootRef = useRef(null);
  const triggerRef = useRef(null);

  const members = useMemo(
    () => (projectMembers || []).map((m) => m?.user).filter(Boolean),
    [projectMembers],
  );

  const patch = (partial) => onChange({ ...filters, ...partial });

  const togglePriority = (key) => {
    const set = new Set(filters.priorities || []);
    if (set.has(key)) set.delete(key);
    else set.add(key);
    patch({ priorities: [...set] });
  };

  const activeCount = useMemo(() => activeFilterCount(filters), [filters]);

  const hasActiveFilters = activeCount > 0;

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      const el = rootRef.current;
      if (el && !el.contains(e.target)) close();
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [open, close]);

  useEffect(() => {
    close();
  }, [projectId, close]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return undefined;
    const update = () => {
      const r = triggerRef.current.getBoundingClientRect();
      const panelW = Math.min(window.innerWidth - 32, 22 * 16); // ~22rem
      const right = Math.max(16, window.innerWidth - r.right);
      const top = r.bottom + 8;
      setMenuPos({ top, right, width: panelW });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative flex shrink-0 justify-end">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls="task-filters-panel"
        id="task-filters-trigger"
        className={`relative inline-flex h-9 w-9 items-center justify-center overflow-visible rounded-md border text-[var(--color-text-secondary)] shadow-sm transition-colors duration-150 hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] ${
          open
            ? "border-[var(--color-border-strong)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)]"
            : "border-[var(--color-border-strong)] bg-[var(--color-card)]"
        } ${hasActiveFilters ? "ring-1 ring-[color-mix(in_oklab,var(--color-primary)_22%,transparent)]" : ""}`}
        title="Filter tasks"
      >
        <FaFilter className="text-xs" aria-hidden />
        {activeCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[9px] font-bold text-white shadow-sm">
            {activeCount > 9 ? "9+" : activeCount}
          </span>
        )}
      </button>

      {open && (
        <div
          id="task-filters-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-filters-title"
          style={{
            position: "fixed",
            top: menuPos.top,
            right: menuPos.right,
            width: menuPos.width,
            maxWidth: "min(22rem, calc(100vw - 2rem))",
          }}
          className="z-40 rounded-[var(--radius-lg)] border border-[var(--color-border-strong)] bg-[var(--color-card)] p-4 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.04] backdrop-blur-xl dark:ring-white/[0.06]"
        >
          <div className="mb-3 flex items-center justify-between gap-2 border-b border-[var(--color-border)] pb-3">
            <h3 id="task-filters-title" className="text-sm font-semibold tracking-tight text-[var(--color-text-primary)]">
              Filters
            </h3>
            <button
              type="button"
              onClick={close}
              className="rounded-[var(--radius-sm)] px-2 py-1 text-xs font-medium text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
            >
              Done
            </button>
          </div>

          <div className="max-h-[min(70vh,28rem)] space-y-4 overflow-y-auto pr-0.5">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-[var(--color-text-muted)]">Search</label>
              <input
                type="search"
                value={filters.search}
                onChange={(e) => patch({ search: e.target.value })}
                placeholder="Title, description, labels…"
                className="app-control px-3 py-2 placeholder:text-[var(--color-text-muted)]"
                autoFocus
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-[var(--color-text-muted)]">Assignee</label>
              <select
                value={filters.assignee}
                onChange={(e) => patch({ assignee: e.target.value })}
                className="app-control cursor-pointer px-3 py-2"
              >
                <option value="all">All assignees</option>
                <option value="unassigned">Unassigned</option>
                {members.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-[var(--color-text-muted)]">Due date</label>
              <select
                value={filters.duePreset}
                onChange={(e) => patch({ duePreset: e.target.value })}
                className="app-control cursor-pointer px-3 py-2"
              >
                <option value="all">All</option>
                <option value="overdue">Overdue</option>
                <option value="this_week">This week</option>
                <option value="no_due">No due date</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-medium text-[var(--color-text-muted)]">
                Priority{" "}
                <span className="font-normal text-[var(--color-text-muted)]/85">(none selected = all)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {PRIORITY_KEYS.map((key) => {
                  const active = (filters.priorities || []).includes(key);
                  const label =
                    key === "none" ? "None" : key.charAt(0).toUpperCase() + key.slice(1);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => togglePriority(key)}
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition duration-200 ease-out ${
                        active
                          ? "border-indigo-500/50 bg-indigo-600/25 text-indigo-900 dark:text-indigo-100"
                          : "border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-secondary)] active:scale-[0.98]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 border-t border-[var(--color-border)] pt-3">
              <button
                type="button"
                onClick={() => onChange(defaultTaskFilters())}
                className="app-btn-modal-secondary w-full !py-2 text-xs"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
