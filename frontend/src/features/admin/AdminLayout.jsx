import { NavLink, Outlet } from "react-router-dom";
import { FaChartBar, FaBuilding, FaTachometerAlt, FaUsers } from "react-icons/fa";

const linkClass = ({ isActive }) =>
  `flex items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
    isActive
      ? "bg-[var(--color-surface-muted)] text-[var(--color-text-primary)]"
      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
  }`;

const items = [
  { to: "/admin/dashboard", label: "Dashboard", icon: FaTachometerAlt },
  { to: "/admin/users", label: "Users", icon: FaUsers },
  { to: "/admin/workspaces", label: "Workspaces", icon: FaBuilding },
  { to: "/admin/analytics", label: "Analytics", icon: FaChartBar },
];

export default function AdminLayout() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-4 lg:flex-row lg:gap-6">
      <aside className="w-full shrink-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3 shadow-sm lg:w-52">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          Administration
        </p>
        <nav className="flex flex-row flex-wrap gap-1 lg:flex-col">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkClass} end={to === "/admin/dashboard"}>
              <Icon className="text-[14px] opacity-80" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
