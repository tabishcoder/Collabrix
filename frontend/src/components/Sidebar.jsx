import { NavLink } from "react-router-dom";
import {
  FaTachometerAlt,
  FaProjectDiagram,
  FaComments,
  FaUsers,
  FaRobot,
} from "react-icons/fa";
import LogoutButton from "./LogoutButton";
import { assests } from "../assets/images/assests"; // make sure the path is correct

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: FaTachometerAlt },
  { label: "Projects", to: "/projects", icon: FaProjectDiagram },
  { label: "Chats", to: "/chats", icon: FaComments },
  { label: "Meetings", to: "/meetings", icon: FaUsers },
  { label: "AI Bot", to: "/aibot", icon: FaRobot },
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex w-36 bg-[var(--color-card)] border-r border-white/10 flex-col">
      {/* Logo */}
      <div className="flex items-center justify-center p-4 border-b border-white/10">
        <img
          src={assests.logo}
          alt="Collabrix Logo"
          className="w-16 h-16 object-contain"
        />
      </div>

      {/* Workspace Name */}
      <div className="p-2 px-4 border-b border-white/10 text-center">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Collabrix
        </h2>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition
              ${
                isActive
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-text-secondary)] hover:bg-white/5"
              }`
            }
          >
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <LogoutButton />
      </div>
    </aside>
  );
}
