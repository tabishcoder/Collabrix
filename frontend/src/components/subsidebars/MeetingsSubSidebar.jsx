import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaCalendarAlt, FaPlus } from "react-icons/fa";
import { loadRecentMeetings } from "../../features/meetings/recentMeetingsStorage";
import { listMeetingsForProjectApi } from "../../features/meetings/meetingsApi";

function isProjectMeetingLog(m) {
  return (m?.callKind || 'meeting') !== 'chat_voice';
}

function mergeMeetingsFromApiAndRecent(apiList, recentList) {
  const byId = new Map();
  for (const m of apiList || []) {
    if (m?._id) byId.set(String(m._id), { ...m });
  }
  for (const m of recentList || []) {
    const id = String(m._id);
    if (!byId.has(id)) {
      byId.set(id, {
        _id: id,
        title: m.title,
        status: m.status,
        updatedAt: m.savedAt,
      });
    }
  }
  return Array.from(byId.values()).sort((a, b) => {
    const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return tb - ta;
  });
}

function statusLabel(status) {
  if (status === "active") return "Live";
  if (status === "ended") return "Ended";
  return status ? String(status) : "";
}

export default function MeetingsSubSidebar({ collapsed }) {
  const navigate = useNavigate();
  const location = useLocation();
  const activeProject = useSelector((s) => s.projects.activeProject);

  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const pid = activeProject?._id ? String(activeProject._id) : null;
    if (!pid) {
      setMeetings([]);
      setError(null);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    setError(null);
    listMeetingsForProjectApi(pid)
      .then((res) => {
        // console.log(res.data);
        if (cancelled) return;
        // const recent = loadRecentMeetings(pid);
        const apiRows = (res.data?.meetings ?? []).filter(isProjectMeetingLog);
        // setMeetings(mergeMeetingsFromApiAndRecent(apiRows, recent.filter(isProjectMeetingLog)));
        setMeetings(apiRows);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = err.response?.data?.message || err.message || "Could not load meetings";
        setError(msg);
        const recent = loadRecentMeetings(pid);
        setMeetings(mergeMeetingsFromApiAndRecent([], recent.filter(isProjectMeetingLog)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeProject?._id, location.pathname]);

  const openSchedule = () => {
    navigate("/meetings", { state: { focusCreate: true } });
  };

  return (
    <aside
      className={`
        flex h-full min-h-0 w-full shrink-0 flex-col border-r border-[var(--color-border-strong)]
        bg-[color-mix(in_oklab,var(--color-card)_96%,transparent)] transition-all duration-300 ease-out
        ${collapsed ? "lg:w-20" : "lg:w-60"}
      `}
    >
      <div className="border-b border-[var(--color-border)] p-4">
        {collapsed ? (
          <span className="text-lg" aria-hidden>
            📅
          </span>
        ) : (
          <div>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Meetings</h3>
            {activeProject?.name && (
              <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-[var(--color-text-muted)]" title={activeProject.name}>
                {activeProject.name}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {!activeProject?._id ? (
          <p className="px-2 text-[11px] text-[var(--color-text-muted)]">
            Pick a project in the header to see meetings for that project.
          </p>
        ) : loading ? (
          <p className="px-2 text-[11px] text-[var(--color-text-muted)]">Loading meetings…</p>
        ) : (
          <>
            {error && (
              <p className="rounded-lg bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-800 dark:text-amber-200" title={error}>
                {error}
              </p>
            )}
            {meetings.length === 0 ? (
              <p className="px-2 text-[11px] text-[var(--color-text-muted)]">
                No meetings yet for this project. Schedule one or start a room from the Meetings page.
              </p>
            ) : (
              meetings.map((m) => {
                const badge = statusLabel(m.status);
                return (
                  <Link
                    key={String(m._id)}
                    to={`/meetings/${m._id}`}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors duration-150 hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
                  >
                    <FaCalendarAlt size={14} className="shrink-0 opacity-80" />
                    <span className="min-w-0 flex-1 truncate" title={m.title}>
                      {m.title || "Meeting"}
                    </span>
                    {badge && (
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          m.status === "active"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : "bg-[var(--color-border)] text-[var(--color-text-muted)]"
                        }`}
                      >
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })
            )}
          </>
        )}
      </div>

      <div className="border-t border-[var(--color-border)] p-3">
        <button
          type="button"
          onClick={openSchedule}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-indigo-700"
        >
          <FaPlus size={12} />
          {!collapsed && "Schedule meeting"}
        </button>
      </div>
    </aside>
  );
}
