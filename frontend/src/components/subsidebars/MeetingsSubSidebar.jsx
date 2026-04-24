import { FaCalendarAlt, FaPlus } from "react-icons/fa";

export default function MeetingsSubSidebar() {
  return (
    <aside className="hidden h-full min-h-0 w-60 shrink-0 flex-col border-r border-[var(--color-border-strong)] bg-[color-mix(in_oklab,var(--color-card)_96%,transparent)] md:flex">
      <div className="border-b border-[var(--color-border)] p-4">
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
          Meetings
        </h3>
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
