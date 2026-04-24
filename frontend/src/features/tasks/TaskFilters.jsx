import { useMemo } from "react";

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

export default function TaskFilters({ filters, onChange, projectMembers = [] }) {
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

  const hasActiveFilters =
    (filters.search || "").trim() !== "" ||
    filters.assignee !== "all" ||
    (filters.priorities || []).length > 0 ||
    filters.duePreset !== "all";

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-card)_78%,transparent)] p-4 sm:p-5 space-y-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[180px] flex-1">
          <label className="text-[11px] text-[var(--color-text-muted)] mb-1 block">Search</label>
          <input
            type="search"
            value={filters.search}
            onChange={(e) => patch({ search: e.target.value })}
            placeholder="Title, description, labels…"
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-input-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-indigo-500/55"
          />
        </div>

        <div className="min-w-[160px]">
          <label className="text-[11px] text-[var(--color-text-muted)] mb-1 block">Assignee</label>
          <select
            value={filters.assignee}
            onChange={(e) => patch({ assignee: e.target.value })}
            className="w-full cursor-pointer rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-input-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-indigo-500/55"
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

        <div className="min-w-[140px]">
          <label className="mb-1 block text-[11px] text-[var(--color-text-muted)]">Due date</label>
          <select
            value={filters.duePreset}
            onChange={(e) => patch({ duePreset: e.target.value })}
            className="w-full cursor-pointer rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-input-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-indigo-500/55"
          >
            <option value="all">All</option>
            <option value="overdue">Overdue</option>
            <option value="this_week">This week</option>
            <option value="no_due">No due date</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => onChange(defaultTaskFilters())}
            className="rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface-muted)] px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
          >
            Clear filters
          </button>
        )}
      </div>

      <div>
        <label className="mb-2 block text-[11px] text-[var(--color-text-muted)]">
          Priority <span className="text-[var(--color-text-muted)]/80">(tap to include; none selected = all)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {PRIORITY_KEYS.map((key) => {
            const active = (filters.priorities || []).includes(key);
            const label =
              key === "none"
                ? "None"
                : key.charAt(0).toUpperCase() + key.slice(1);
            return (
              <button
                key={key}
                type="button"
                onClick={() => togglePriority(key)}
                className={`px-2.5 py-1 rounded-full border text-xs font-medium transition ${
                  active
                    ? "border-indigo-500/50 bg-indigo-600/25 text-indigo-900 dark:text-indigo-100"
                    : "border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-secondary)]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
