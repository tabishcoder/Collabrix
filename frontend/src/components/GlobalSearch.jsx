import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import { searchWorkspaceApi } from "../features/search/searchApi";

export default function GlobalSearch({ spaceId }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const timerRef = useRef(null);

  const runSearch = useCallback(async (term) => {
    if (!spaceId || !term.trim()) {
      setProjects([]);
      setTasks([]);
      return;
    }
    setLoading(true);
    try {
      const res = await searchWorkspaceApi(spaceId, term.trim());
      setProjects(res.data?.projects || []);
      setTasks(res.data?.tasks || []);
    } catch {
      setProjects([]);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [spaceId]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!spaceId || !q.trim()) {
      setProjects([]);
      setTasks([]);
      return;
    }
    timerRef.current = setTimeout(() => {
      runSearch(q);
    }, 320);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [q, spaceId, runSearch]);

  if (!spaceId) {
    return (
      <div className="relative mx-4 hidden max-w-md flex-1 md:block">
        <p className="rounded-md border border-[var(--color-border)] bg-[var(--color-input-bg)] px-3 py-2 text-[12px] text-[var(--color-text-muted)]">
          Select a workspace to search
        </p>
      </div>
    );
  }

  const showPanel = open && q.trim().length > 0;

  return (
    <div className="relative mx-4 hidden max-w-md flex-1 md:block">
      <div className="relative">
        <FaSearch className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[var(--color-text-muted)]" aria-hidden />
        <input
          type="search"
          value={q}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search projects & tasks…"
          className="app-control w-full border-[var(--color-border)] bg-[var(--color-input-bg)] py-2 pl-8 pr-3 text-[13px] placeholder:text-[var(--color-text-muted)]"
          autoComplete="off"
        />
      </div>

      {showPanel && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-md border border-[var(--color-border-strong)] bg-[var(--color-dropdown-bg)] p-2 shadow-lg ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
          {loading && <p className="px-2 py-2 text-[12px] text-[var(--color-text-muted)]">Searching…</p>}
          {!loading && !projects.length && !tasks.length && (
            <p className="px-2 py-2 text-[12px] text-[var(--color-text-muted)]">No matches.</p>
          )}
          {projects.length > 0 && (
            <div className="mb-2">
              <p className="px-2 py-1 text-[10px] font-semibold uppercase text-[var(--color-text-muted)]">Projects</p>
              <ul>
                {projects.map((p) => (
                  <li key={p._id}>
                    <Link
                      to={`/projects/${p._id}`}
                      className="block rounded px-2 py-1.5 text-[13px] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                    >
                      {p.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {tasks.length > 0 && (
            <div>
              <p className="px-2 py-1 text-[10px] font-semibold uppercase text-[var(--color-text-muted)]">Tasks</p>
              <ul>
                {tasks.map((t) => {
                  const pid = t.projectId?._id || t.projectId;
                  return (
                    <li key={t._id}>
                      <Link
                        to={pid ? `/projects/${pid}` : "/projects"}
                        className="block rounded px-2 py-1.5 text-left hover:bg-[var(--color-surface-hover)]"
                      >
                        <span className="block text-[13px] font-medium text-[var(--color-text-primary)]">{t.title}</span>
                        <span className="block text-[11px] text-[var(--color-text-muted)]">
                          {t.projectId?.name || "Project"}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
