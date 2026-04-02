import { FaPlus, FaHashtag, FaUser } from "react-icons/fa";

export default function ChatsSubSidebar() {
  return (
    <aside className="hidden md:flex w-60 bg-[var(--color-card)] border-r border-white/10 flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Chats
        </h3>
      </div>

      {/* Channels */}
      <div className="p-3">
        <p className="text-xs mb-2 opacity-60">Channels</p>
        {[1, 2].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-white/5 cursor-pointer"
          >
            <FaHashtag size={12} />
            general
          </div>
        ))}
      </div>

      {/* DMs */}
      <div className="flex-1 overflow-y-auto p-3">
        <p className="text-xs mb-2 opacity-60">Direct Messages</p>
        {[1, 2, 3].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-white/5 cursor-pointer"
          >
            <FaUser size={12} />
            User Name
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/10">
        <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-white/5 hover:bg-white/10 text-sm">
          <FaPlus size={12} />
          New Chat
        </button>
      </div>
    </aside>
  );
}
