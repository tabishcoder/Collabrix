import { NavLink } from "react-router-dom";
import {
  FaTachometerAlt,
  FaProjectDiagram,
  FaComments,
  FaUsers,
  FaRobot,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: FaTachometerAlt },
  { label: "Projects", to: "/projects", icon: FaProjectDiagram },
  { label: "Chats", to: "/chats", icon: FaComments },
  { label: "Meetings", to: "/meetings", icon: FaUsers },
  { label: "AI Bot", to: "/aibot", icon: FaRobot },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  return (
    <aside
      className={`
        h-full min-h-0 flex flex-col shrink-0
        bg-[color-mix(in_oklab,var(--color-card)_92%,transparent)]
        backdrop-blur-md
        border-r border-[var(--color-border-strong)]
        shadow-[var(--shadow-nav)]
        transition-all duration-300 ease-out
        ${collapsed ? "w-20" : "w-64"}
      `}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
        {!collapsed && (
          <h1 className="text-sm font-bold text-[var(--color-text-primary)]">
            Collabrix
          </h1>
        )}

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-2 text-[var(--color-text-secondary)] transition-all duration-200 hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
        >
          {collapsed ? (
            <FaChevronRight size={14} />
          ) : (
            <FaChevronLeft size={14} />
          )}
        </button>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-3 py-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `
                flex items-center gap-3 px-3.5 py-2.5 rounded-[var(--radius-md)]
                transition-all duration-200
                ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
                }
              `
              }
            >
              <Icon className="text-base min-w-[20px]" />
              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* FOOTER */}
      {!collapsed && (
        <div className="m-3 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface-muted)] p-4">
          <p className="text-[10px] text-[var(--color-text-muted)] uppercase mb-2.5 font-bold tracking-wider">
            Support
          </p>
          <button
            type="button"
            className="text-sm font-medium text-[var(--color-text-secondary)] transition-colors duration-150 hover:text-[var(--color-text-primary)]"
          >
            Help Center
          </button>
        </div>
      )}
    </aside>
  );
}