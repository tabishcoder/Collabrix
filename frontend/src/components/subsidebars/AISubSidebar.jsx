import { useSelector } from "react-redux";
import { FaRobot, FaHistory } from "react-icons/fa";

export default function AISubSidebar({ collapsed }) {
  const activeProject = useSelector((s) => s.projects.activeProject);

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
            🤖
          </span>
        ) : (
          <div>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">AI Assistant</h3>
            {activeProject?.name && (
              <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-[var(--color-text-muted)]" title={activeProject.name}>
                {activeProject.name}
              </p>
            )}
          </div>
        )}
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
