import { useState } from "react";
import { FaBars, FaChevronDown } from "react-icons/fa";
import { useSelector } from "react-redux";
import LogoutButton from "./LogoutButton";
import { assests } from "../assets/images/assests";

export default function TopNavbar() {
  const { user } = useSelector((state) => state.auth);
  const { activeSpace } = useSelector((s) => s.spaces);

  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  return (
    <header className="h-14 bg-[var(--color-card)] border-b border-white/10 flex items-center justify-between px-4 relative">
      {/* Left: Hamburger + Logo + Workspace */}
      <div className="flex items-center gap-3">
        {/* Hamburger (mobile only) */}
        <button className="md:hidden text-[var(--color-text-primary)]">
          <FaBars size={18} />
        </button>

      

        {/* Workspace name + dropdown */}
        <div className="relative">
          <button
            onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
            className="flex items-center gap-1 font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-highlight)]"
          >
            {activeSpace?.name || "No Workspace"}
            <FaChevronDown className="text-xs" />
          </button>

          {/* Dropdown */}
          {workspaceDropdownOpen && (
            <div className="absolute left-0 top-full mt-1 w-48 bg-[var(--color-card)] border border-white/10 shadow-lg rounded-md p-2 z-20">
              <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                Current: {activeSpace?.name || "None"}
              </p>
              <button
                className="w-full text-left text-sm px-2 py-1 rounded hover:bg-white/10 text-[var(--color-text-primary)]"
                onClick={() => console.log("Open Create Workspace Modal")}
              >
                + Create New Workspace
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right: Profile */}
      <div className="flex items-center gap-3 relative">
        <span className="hidden sm:block text-sm text-[var(--color-text-secondary)]">
          {user?.name}
        </span>

        <button
          onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
          className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-sm font-semibold"
        >
          {user?.name?.[0] || "U"}
        </button>

        {/* Profile Dropdown */}
        {profileDropdownOpen && (
          <div className="absolute right-0 top-full mt-1 w-40 bg-[var(--color-card)] border border-white/10 shadow-lg rounded-md p-2 z-20">
            <button className="w-full text-left text-sm px-2 py-1 rounded hover:bg-white/10 text-[var(--color-text-primary)]">
              Profile
            </button>
            <LogoutButton />
          </div>
        )}
      </div>
    </header>
  );
}
