import { FaCalendarAlt, FaPlus } from "react-icons/fa";

export default function MeetingsSubSidebar() {
  return (
    <aside className="hidden md:flex w-60 bg-[#0a0a0b]/95 border-r border-white/8 flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/8">
        <h3 className="text-sm font-bold text-white/90">
          Meetings
        </h3>
      </div>

      {/* Meetings list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {[1, 2].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm hover:bg-white/10 cursor-pointer text-white/70 hover:text-white transition-colors duration-150 font-medium"
          >
            <FaCalendarAlt size={14} />
            Weekly Sync
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/8">
        <button className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors duration-200">
          <FaPlus size={12} />
          Schedule Meeting
        </button>
      </div>
    </aside>
  );
}
