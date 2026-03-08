import { NavLink } from "react-router-dom";
import {
  FaTachometerAlt,
  FaProjectDiagram,
  FaComments,
  FaUsers,
  FaRobot,
} from "react-icons/fa";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: FaTachometerAlt },
  { label: "Project Boards", to: "/projects", icon: FaProjectDiagram },
  { label: "Chats", to: "/chats", icon: FaComments },
  { label: "Meetings", to: "/meetings", icon: FaUsers },
  { label: "AI Bot", to: "/aibot", icon: FaRobot },
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex w-64 bg-[var(--color-card)] border-r border-white/5 flex-col h-screen sticky top-0">
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
        {navItems.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
              ${
                isActive
                  ? "bg-[var(--color-primary)] text-white shadow-lg shadow-indigo-500/20"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`
            }
          >
            <Icon className="text-lg" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 bg-white/2 m-4 rounded-2xl border border-white/5">
        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 px-2">
          Support
        </p>
        <button className="w-full text-left px-3 py-2 text-xs text-white/60 hover:text-white transition">
          Help Center
        </button>
      </div>
    </aside>
  );
}
