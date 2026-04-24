import { FaRobot, FaHistory } from "react-icons/fa";

export default function AISubSidebar() {
  return (
    <aside className="hidden md:flex w-60 bg-[#0a0a0b]/95 border-r border-white/8 flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/8">
        <h3 className="text-sm font-bold text-white/90">
          AI Assistant
        </h3>
      </div>

      {/* Actions */}
      <div className="p-3 space-y-2">
        <button className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-lg hover:bg-white/10 text-sm font-medium text-white/70 hover:text-white transition-colors duration-150">
          <FaRobot size={14} />
          Ask AI
        </button>

        <button className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-lg hover:bg-white/10 text-sm font-medium text-white/70 hover:text-white transition-colors duration-150">
          <FaHistory size={14} />
          History
        </button>
      </div>

      {/* Fill space */}
      <div className="flex-1" />

      {/* Footer */}
      <div className="p-3 border-t border-white/8 text-xs text-white/50 font-medium">
        Context-aware AI tools
      </div>
    </aside>
  );
}
