import { FaCalendarAlt, FaPlus } from "react-icons/fa";

export default function MeetingsSubSidebar() {
  return (
    <aside className="hidden md:flex w-60 bg-[var(--color-card)] border-r border-white/10 flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Meetings
        </h3>
      </div>

      {/* Meetings list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {[1, 2].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-white/5 cursor-pointer"
          >
            <FaCalendarAlt size={14} />
            Weekly Sync
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/10">
        <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-[var(--color-primary)] text-white text-sm hover:bg-[var(--color-highlight)] transition">
          <FaPlus size={12} />
          Schedule Meeting
        </button>
      </div>
    </aside>
  );
}
