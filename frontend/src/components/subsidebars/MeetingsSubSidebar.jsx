import { useSelector } from "react-redux";
import { FaCalendarAlt, FaPlus } from "react-icons/fa";

export default function MeetingsSubSidebar({ collapsed }) {
  const activeProject = useSelector((s) => s.projects.activeProject);

  return (
    <aside
      className={`
        hidden h-full min-h-0 shrink-0 flex-col border-r border-[var(--color-border-strong)]
        bg-[color-mix(in_oklab,var(--color-card)_96%,transparent)] transition-all duration-300 ease-out md:flex
        ${collapsed ? "w-20" : "w-60"}
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
        {[1, 2].map((_, i) => (
          <div
            key={i}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors duration-150 hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
          >
            <FaCalendarAlt size={14} />
            Weekly Sync
          </div>
        ))}
      </div>

      <div className="border-t border-[var(--color-border)] p-3">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-indigo-700"
        >
          <FaPlus size={12} />
          Schedule Meeting
        </button>
      </div>
    </aside>
  );
}
