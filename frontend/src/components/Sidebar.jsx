import { NavLink, useLocation } from "react-router-dom";
import { useMemo } from "react";
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
  FaQuestionCircle,
} from "react-icons/fa";
import { isPlatformAdmin } from "../utils/roles";
import { useViewport } from "../hooks/useViewport";

export default function Sidebar({ collapsed, setCollapsed, onNavigate }) {
  const user = useSelector((s) => s.auth.user);
  const activeSpace = useSelector((s) => s.spaces.activeSpace);
  const { pathname } = useLocation();
  const activeProject = useSelector((s) => s.projects.activeProject);
  const projectsTo = activeProject?._id ? `/projects/${activeProject._id}` : "/projects";
  const { isTiny, isBetween, isLgUp } = useViewport();
  const platformAdmin = isPlatformAdmin(user);

  const navItems = useMemo(() => {
    const dashboard = { label: "Overview", to: "/welcome", icon: FaTachometerAlt };
    const platform = { label: "Platform", to: "/admin/dashboard", icon: FaShieldAlt };
    const projects = { label: "Projects", to: projectsTo, icon: FaProjectDiagram };
    const chats = { label: "Chats", to: "/chats", icon: FaComments };
    const meetings = { label: "Meetings", to: "/meetings", icon: FaUsers };
    const ai = { label: "AI Bot", to: "/aibot", icon: FaRobot };

    const core = [dashboard];
    if (platformAdmin) core.push(platform);

    if (!activeSpace) return core;

    if (isTiny) return core;

    // Tablet / small laptop: chats, meetings, assistant — boards stay desktop-only (see FeatureGate).
    if (isBetween) return [...core, chats, meetings, ai];

    if (isLgUp) return [...core, projects, chats, meetings, ai];

    return [...core, chats, meetings, ai];
  }, [activeProject?._id, activeSpace, isBetween, isLgUp, isTiny, platformAdmin, projectsTo]);

  return (
    <aside
      className={`
        h-full min-h-0 flex flex-col shrink-0
        border-r border-[var(--color-border-strong)]
        bg-[var(--color-sidebar-bg)]
        shadow-[var(--shadow-nav)]
        transition-[width] duration-200 ease-out
        w-full
        ${collapsed ? "lg:w-20" : "lg:w-60"}
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
          className="hidden rounded-md p-2 text-[var(--color-text-secondary)] transition-colors duration-150 hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] lg:inline-flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <FaChevronRight size={14} />
          ) : (
            <FaChevronLeft size={14} />
          )}
        </button>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto overscroll-contain px-2 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={`${item.label}-${item.to}`}
              to={item.to}
              onClick={() => onNavigate?.()}
              className={({ isActive }) => {
                const active =
                  item.label === "Projects"
                    ? pathname.startsWith("/projects")
                    : item.label === "Overview"
                      ? pathname === "/welcome" || pathname === "/dashboard"
                      : item.label === "Platform"
                        ? pathname.startsWith("/admin")
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
      <div className="m-2">
        {collapsed ? (
          <NavLink
            to="/help/faq"
            title="Help & FAQs"
            aria-label="Help and FAQs"
            onClick={() => onNavigate?.()}
            className="flex items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-card)]/50 p-2.5 text-[var(--color-text-secondary)] transition-colors duration-150 hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
          >
            <FaQuestionCircle className="text-[16px]" aria-hidden />
          </NavLink>
        ) : (
          <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-card)]/50 p-3">
            <p className="mb-1.5 text-[11px] font-medium text-[var(--color-text-muted)]">Support</p>
            <NavLink
              to="/help/faq"
              onClick={() => onNavigate?.()}
              className="text-[13px] font-medium text-[var(--color-text-secondary)] transition-colors duration-150 hover:text-[var(--color-text-primary)]"
            >
              Help Center
            </NavLink>
          </div>
        )}
      </div>
    </aside>
  );
}
