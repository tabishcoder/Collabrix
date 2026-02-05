import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FaTachometerAlt,
  FaProjectDiagram,
  FaComments,
  FaUsers,
  FaRobot,
  FaBars,
} from "react-icons/fa";
import LogoutButton from "../LogoutButton";
import { assests } from "../../assets/images/assests";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: <FaTachometerAlt /> },
  { label: "Project Board", to: "/projects", icon: <FaProjectDiagram /> },
  { label: "Chats", to: "/chats", icon: <FaComments /> },
  { label: "Meetings", to: "/meetings", icon: <FaUsers /> },
  { label: "AI Bot", to: "/aibot", icon: <FaRobot /> },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) return null; // Hide sidebar if not logged in

  return (
    <div
      className={`flex flex-col h-screen bg-gray-900 text-white transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Logo & Collapse Button */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700">
        <Link to="/" className="flex items-center space-x-3">
          <img
            src={assests.logo}
            alt="Logo"
            className="w-10 h-10 object-contain"
          />
          {!collapsed && (
            <span className="text-xl font-bold text-indigo-500">Collabrix</span>
          )}
        </Link>
        <button
          className="text-gray-400 hover:text-white focus:outline-none"
          onClick={() => setCollapsed(!collapsed)}
        >
          <FaBars />
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-2 py-4 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-200
              ${
                location.pathname === item.to
                  ? "bg-indigo-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
          >
            <span className="text-lg">{item.icon}</span>
            {!collapsed && <span className="font-medium">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="px-4 py-4 border-t border-gray-700 flex flex-col gap-2">
        {!collapsed && (
          <span className="text-gray-400 text-sm">
            Hi, <strong className="text-white">{user?.name}</strong>
          </span>
        )}
        <LogoutButton className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors text-sm" />
      </div>
    </div>
  );
}
