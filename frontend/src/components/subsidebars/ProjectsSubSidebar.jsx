export default function ProjectsSubSidebar({ collapsed }) {
  return (
    <aside
      className={`
        h-screen flex flex-col
        bg-[var(--color-card)]
        border-r border-white/10
        transition-all duration-300
        ${collapsed ? "w-20" : "w-64"}
      `}
    >
      {/* HEADER */}
      <div className="p-4 border-b border-white/10">
        {collapsed ? (
          <div className="text-center">📁</div>
        ) : (
          <>
            <h3 className="text-sm font-semibold text-white/80">
              Projects
            </h3>
            <p className="text-xs text-white/40 mt-1">
              Workspace level
            </p>
          </>
        )}
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {[1, 2, 3].map((_, i) => (
          <div
            key={i}
            className="
              px-3 py-2 rounded-md
              text-sm text-white/70
              hover:bg-white/5 cursor-pointer
              flex items-center gap-2
            "
          >
            {collapsed ? "📌" : "Project Name"}
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <div className="p-3 border-t border-white/10">
        <button className="w-full px-2 py-2 rounded-md bg-indigo-600 text-white text-sm">
          {collapsed ? "+" : "+ New Project"}
        </button>
      </div>
    </aside>
  );
}