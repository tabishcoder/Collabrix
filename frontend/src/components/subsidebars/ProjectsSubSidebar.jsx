import { FaPlus, FaFolderOpen } from "react-icons/fa";

export default function ProjectsSubSidebar() {
  return (
    <aside className="hidden md:flex w-60 bg-[var(--color-card)] border-r border-white/10 flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Projects
        </h3>
      </div>

      {/* Project list placeholder */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {[1, 2, 3].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-[var(--color-text-secondary)] hover:bg-white/5 cursor-pointer"
          >
            <FaFolderOpen size={14} />
            Project Name
          </div>
        ))}
      </div>

      {/* Footer action */}
      <div className="p-3 border-t border-white/10">
        <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-[var(--color-primary)] text-white text-sm hover:bg-[var(--color-highlight)] transition">
          <FaPlus size={12} />
          New Project
        </button>
      </div>
    </aside>
  );
}
