export default function ChatsSubSidebar({ collapsed }) {
  return (
    <aside
      className={`
        h-screen flex flex-col
        bg-[#0a0a0b]/95
        border-r border-white/8
        transition-all duration-300 ease-out
        ${collapsed ? "w-20" : "w-64"}
      `}
    >
      <div className="p-4 border-b border-white/8">
        {collapsed ? "💬" : (
          <h3 className="text-sm font-bold text-white/90">Chats</h3>
        )}
      </div>

      <div className="flex-1 p-3 space-y-2">
        {[1, 2].map((_, i) => (
          <div
            key={i}
            className="px-3 py-2.5 rounded-lg hover:bg-white/10 text-sm text-white/70 hover:text-white transition-colors duration-150 cursor-pointer font-medium"
          >
            {collapsed ? "@" : "General Chat"}
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-white/8">
        <button className="w-full px-3 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-sm font-medium text-white transition-colors duration-200">
          {collapsed ? "+" : "New Chat"}
        </button>
      </div>
    </aside>
  );
}