import { FaRobot, FaHistory } from "react-icons/fa";

export default function AISubSidebar() {
  return (
    <aside className="hidden md:flex w-60 bg-[var(--color-card)] border-r border-white/10 flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          AI Assistant
        </h3>
      </div>

      {/* Actions */}
      <div className="p-3 space-y-2">
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/5 text-sm">
          <FaRobot size={14} />
          Ask AI
        </button>

        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/5 text-sm">
          <FaHistory size={14} />
          History
        </button>
      </div>

      {/* Fill space */}
      <div className="flex-1" />

      {/* Footer */}
      <div className="p-3 border-t border-white/10 text-xs opacity-60">
        Context-aware AI tools
      </div>
    </aside>
  );
}
