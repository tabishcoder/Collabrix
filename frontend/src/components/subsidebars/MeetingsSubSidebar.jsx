import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaCalendarAlt, FaPlus } from "react-icons/fa";
import { loadRecentMeetings } from "../../features/meetings/recentMeetingsStorage";

export default function MeetingsSubSidebar({ collapsed }) {
  const navigate = useNavigate();
  const location = useLocation();
  const activeProject = useSelector((s) => s.projects.activeProject);

  const recent = useMemo(() => {
    if (!activeProject?._id) return [];
    return loadRecentMeetings(String(activeProject._id));
    // pathname: re-read sessionStorage when navigating between meeting routes
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            Pick a project in the header to see recent rooms.
          </p>
        ) : recent.length === 0 ? (
          <p className="px-2 text-[11px] text-[var(--color-text-muted)]">
            Recent meetings for this project will appear here after you start or join one.
          </p>
        ) : (
          recent.map((m) => (
            <Link
              key={m._id}
              to={`/meetings/${m._id}`}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors duration-150 hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
            >
              <FaCalendarAlt size={14} className="shrink-0 opacity-80" />
              <span className="min-w-0 flex-1 truncate" title={m.title}>
                {m.title}
              </span>
            </Link>
          ))
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
