import { NavLink, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FaTachometerAlt,
  FaProjectDiagram,
  FaComments,
  FaUsers,
  FaRobot,
  FaChevronLeft,
  FaChevronRight,
  FaShieldAlt,
} from "react-icons/fa";
import { isPlatformAdmin } from "../utils/roles";

export default function Sidebar({ collapsed, setCollapsed }) {
  const user = useSelector((s) => s.auth.user);
  const { pathname } = useLocation();
  const activeProject = useSelector((s) => s.projects.activeProject);
  const projectsTo = activeProject?._id ? `/projects/${activeProject._id}` : "/projects";

  const baseNavItems = [
    { label: "Dashboard", to: "/dashboard", icon: FaTachometerAlt },
    { label: "Projects", to: projectsTo, icon: FaProjectDiagram },
    { label: "Chats", to: "/chats", icon: FaComments },
    { label: "Meetings", to: "/meetings", icon: FaUsers },
    { label: "AI Bot", to: "/aibot", icon: FaRobot },
  ];

  const navItems = isPlatformAdmin(user)
    ? [
        ...baseNavItems.slice(0, 1),
        { label: "Platform", to: "/admin", icon: FaShieldAlt },
        ...baseNavItems.slice(1),
      ]
    : baseNavItems;

  return (
    <aside
      className={`
        h-full min-h-0 flex flex-col shrink-0
        border-r border-[var(--color-border-strong)]
        bg-[var(--color-sidebar-bg)]
        shadow-[var(--shadow-nav)]
        transition-[width] duration-200 ease-out
        ${collapsed ? "w-20" : "w-60"}
      `}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-3">
        {!collapsed && (
          <h1 className="text-[13px] font-semibold tracking-tight text-[var(--color-text-primary)]">
            Collabrix
          </h1>
        )}

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-2 text-[var(--color-text-secondary)] transition-colors duration-150 hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
        >
          {collapsed ? (
            <FaChevronRight size={14} />
          ) : (
            <FaChevronLeft size={14} />
          )}
        </button>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={`${item.label}-${item.to}`}
              to={item.to}
              className={({ isActive }) => {
                const active =
                  item.label === "Projects"
                    ? pathname.startsWith("/projects")
                    : isActive;
                return `
                flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium
                transition-colors duration-150
                ${
                  active
                    ? "bg-[color-mix(in_oklab,var(--color-primary)_14%,transparent)] text-[var(--color-primary)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-primary)_28%,transparent)] dark:text-indigo-200"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
                }
              `;
              }}
            >
              <Icon className="min-w-[18px] text-[15px] opacity-90" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* FOOTER */}
      {!collapsed && (
        <div className="m-2 rounded-md border border-[var(--color-border)] bg-[var(--color-card)]/50 p-3">
          <p className="mb-1.5 text-[11px] font-medium text-[var(--color-text-muted)]">Support</p>
          <button
            type="button"
            className="text-[13px] font-medium text-[var(--color-text-secondary)] transition-colors duration-150 hover:text-[var(--color-text-primary)]"
          >
            Help Center
          </button>
        </div>
      )}
    </aside>
  );
}
