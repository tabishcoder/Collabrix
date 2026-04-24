import { FaRobot, FaHistory } from "react-icons/fa";

export default function AISubSidebar() {
  return (
    <aside className="hidden h-full min-h-0 w-60 shrink-0 flex-col border-r border-[var(--color-border-strong)] bg-[color-mix(in_oklab,var(--color-card)_96%,transparent)] md:flex">
      <div className="border-b border-[var(--color-border)] p-4">
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
          AI Assistant
        </h3>
      </div>

      <div className="space-y-2 p-3">
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors duration-150 hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
        >
          <FaRobot size={14} />
          Ask AI
        </button>

        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors duration-150 hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
        >
          <FaHistory size={14} />
          History
        </button>
      </div>

      <div className="flex-1" />

      <div className="border-t border-[var(--color-border)] p-3 text-xs font-medium text-[var(--color-text-muted)]">
        Context-aware AI tools
      </div>
    </aside>
  );
}
