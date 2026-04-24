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
        h-screen flex flex-col sticky top-0
        bg-[#0a0a0b]/95
        border-r border-white/8
        transition-all duration-300 ease-out
        ${collapsed ? "w-20" : "w-64"}
      `}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between p-4 border-b border-white/8">
        {!collapsed && (
          <h1 className="text-sm font-bold text-white/90">
            Collabrix
          </h1>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-all duration-200"
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
        {navItems.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `
              flex items-center gap-3 px-3.5 py-2.5 rounded-lg
              transition-all duration-200
              ${
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }
            `
            }
          >
            <Icon className="text-base min-w-[20px]" />
            {!collapsed && <span className="text-sm font-medium">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* FOOTER */}
      {!collapsed && (
        <div className="p-4 m-3 rounded-lg bg-white/8 border border-white/12">
          <p className="text-[10px] text-white/50 uppercase mb-2.5 font-bold tracking-wider">
            Support
          </p>
          <button className="text-sm text-white/70 hover:text-white transition-colors duration-150 font-medium">
            Help Center
          </button>
        </div>
      )}
    </aside>
  );
}