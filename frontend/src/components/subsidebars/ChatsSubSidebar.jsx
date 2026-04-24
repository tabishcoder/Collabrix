export default function ChatsSubSidebar({ collapsed }) {
  return (
    <aside
      className={`
        flex h-full min-h-0 shrink-0 flex-col
        border-r border-[var(--color-border-strong)]
        bg-[color-mix(in_oklab,var(--color-card)_96%,transparent)]
        transition-all duration-300 ease-out
        ${collapsed ? "w-20" : "w-64"}
      `}
    >
      <div className="border-b border-[var(--color-border)] p-4">
        {collapsed ? "💬" : (
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Chats</h3>
        )}
      </div>

      <div className="flex-1 space-y-2 p-3">
        {[1, 2].map((_, i) => (
          <div
            key={i}
            className="cursor-pointer rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors duration-150 hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
          >
            {collapsed ? "@" : "General Chat"}
          </div>
        ))}
      </div>

      <div className="border-t border-[var(--color-border)] p-3">
        <button
          type="button"
          className="w-full rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-indigo-700"
        >
          {collapsed ? "+" : "New Chat"}
        </button>
      </div>
    </aside>
  );
}
