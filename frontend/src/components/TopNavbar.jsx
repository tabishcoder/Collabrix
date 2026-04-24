import { useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setActiveProject } from "../features/projects/projectSlice";
import {
  FaBars,
  FaChevronDown,
  FaBell,
  FaSearch,
  FaFolder,
  FaPlus,
  FaClock,
  FaCheckCircle,
  FaUserPlus,
} from "react-icons/fa";

import LogoutButton from "./LogoutButton";
import InviteModal  from "../features/invites/InviteModal";
import WorkspaceMembersModal from "../features/spaces/WorkspaceMembersModal";
import { canManageSpace, spaceRoleLabel, spaceRoleBadgeClass } from "../utils/roles";

export default function TopNavbar({ onToggleSidebar }) {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { user }                      = useSelector((state) => state.auth);
  const { activeSpace }               = useSelector((s) => s.spaces);
  const { activeProject, projects }   = useSelector((s) => s.projects);

  const { activeSpaceRole }             = useSelector((s) => s.spaces);

  const [openDropdown,  setOpenDropdown]  = useState(null);
  const [projectSearch, setProjectSearch] = useState("");
  const [showInvite,    setShowInvite]    = useState(false);
  const [showMembers,   setShowMembers]   = useState(false);

  const isSpaceAdmin = canManageSpace(activeSpaceRole);

  const filteredProjects = useMemo(() => {
    return (
      projects?.filter((p) =>
        p.name.toLowerCase().includes(projectSearch.toLowerCase())
      ) || []
    );
  }, [projects, projectSearch]);

  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  return (
    <>
    <header className="h-16 bg-[#0a0a0b]/95 backdrop-blur-lg border-b border-white/8 flex items-center justify-between px-8 sticky top-0 z-50 shadow-sm">

      {/* LEFT SECTION */}
      <div className="flex items-center gap-6">

        {/* Mobile Menu */}
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-white/8 rounded-lg text-white/70 md:hidden transition-colors duration-200"
        >
          <FaBars size={18} />
        </button>

        {/* WORKSPACE + PROJECT */}
        <div className="flex items-center gap-3">

          {/* 🔵 WORKSPACE */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown("workspace")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600/15 border border-indigo-500/30 hover:bg-indigo-600/25 transition-all duration-200 font-medium"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-[11px] font-bold text-white">
                {activeSpace?.name?.[0] || "W"}
              </div>

              <div className="hidden lg:flex flex-col leading-tight">
                <span className="text-[11px] text-indigo-400 uppercase tracking-wider font-semibold">
                  Workspace
                </span>
                <span className="text-sm font-bold text-indigo-100">
                  {activeSpace?.name || "Workspace"}
                </span>
              </div>

              {activeSpaceRole && (
                <span
                  className={`hidden sm:inline-flex px-2 py-0.5 rounded-full border text-[10px] font-semibold shrink-0 ${spaceRoleBadgeClass(activeSpaceRole)}`}
                  title={`Your workspace role: ${spaceRoleLabel(activeSpaceRole)}`}
                >
                  {spaceRoleLabel(activeSpaceRole)}
                </span>
              )}

              <FaChevronDown
                className={`text-xs text-white/40 transition ${
                  openDropdown === "workspace" ? "rotate-180" : ""
                }`}
              />
            </button>

            {openDropdown === "workspace" && (
              <div className="absolute left-0 mt-3 w-60 bg-[#0f0f11] border border-white/12 rounded-lg shadow-lg p-2 backdrop-blur-sm">
                <p className="px-3 py-2 text-xs text-indigo-400 uppercase font-bold tracking-wider">
                  Workspaces
                </p>

                <button className="w-full px-3 py-2.5 text-left rounded-md hover:bg-indigo-600/20 text-white font-medium transition-colors duration-150">
                  {activeSpace?.name}
                </button>

                {/* Invite Members — admin/owner only */}
                {isSpaceAdmin && (
                  <>
                    <div className="h-[1px] bg-white/8 my-1.5" />
                    <button
                      onClick={() => { setOpenDropdown(null); setShowMembers(true); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm text-white/70 hover:text-white hover:bg-white/8 transition-colors duration-150"
                    >
                      Manage Members
                    </button>
                    <button
                      onClick={() => { setOpenDropdown(null); setShowInvite(true); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm text-indigo-300 hover:text-indigo-200 hover:bg-indigo-600/15 transition-colors duration-150"
                    >
                      <FaUserPlus className="text-xs" />
                      Invite Members
                    </button>
                  </>
                )}

                <div className="h-[1px] bg-white/8 my-1.5" />

                <button className="w-full px-3 py-2.5 text-left text-sm text-white/70 hover:text-white hover:bg-white/8 rounded-md transition-colors duration-150">
                  + New Workspace
                </button>
              </div>
            )}
          </div>

          {/* DOT SEPARATOR */}
          <div className="w-1 h-1 bg-white/30 rounded-full" />

          {/* 🟢 PROJECT */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown("project")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500/12 border border-emerald-500/25 hover:bg-emerald-500/20 transition-all duration-200 font-medium"
            >
              <FaFolder className="text-emerald-400 text-sm" />

              <div className="flex flex-col leading-tight">
                <span className="text-[11px] text-emerald-400 uppercase font-semibold tracking-wider">
                  Project
                </span>
                <span className="text-sm text-white font-bold truncate max-w-[120px]">
                  {activeProject?.name || "Select Project"}
                </span>
              </div>

              <FaChevronDown
                className={`text-xs text-white/40 transition ${
                  openDropdown === "project" ? "rotate-180" : ""
                }`}
              />
            </button>

            {openDropdown === "project" && (
              <div className="absolute left-0 mt-3 w-72 bg-[#0f0f11] border border-white/12 rounded-lg shadow-lg overflow-hidden backdrop-blur-sm">

                {/* Search */}
                <div className="p-3 border-b border-white/8">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-xs" />
                    <input
                      autoFocus
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      placeholder="Search project..."
                      className="w-full bg-white/8 border border-white/12 rounded-md py-2 pl-8 pr-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-150"
                    />
                  </div>
                </div>

                {/* List */}
                <div className="max-h-60 overflow-y-auto p-1.5">
                  {filteredProjects.map((p) => (
                    <button
                      key={p._id}
                      onClick={() => {
                        dispatch(setActiveProject(p));
                        navigate(`/projects/${p._id}`);
                        setOpenDropdown(null);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm text-white/70 hover:text-white hover:bg-emerald-600/25 transition-colors duration-150"
                    >
                      <span className="font-medium">{p.name}</span>
                      {p._id === activeProject?._id && (
                        <FaCheckCircle className="text-emerald-400 text-xs" />
                      )}
                    </button>
                  ))}
                </div>

                <button className="w-full px-4 py-3 text-xs text-emerald-400 font-semibold border-t border-white/8 hover:bg-white/8 transition-colors duration-150">
                  <FaPlus className="inline mr-2" />
                  New Project
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🔍 CENTER SEARCH */}
      <div className="hidden md:flex flex-1 justify-center px-8">
        <div className="w-full max-w-md relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-xs" />
          <input
            type="text"
            placeholder="Search anything..."
            className="w-full bg-white/8 border border-white/12 rounded-lg py-2.5 pl-9 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-150"
          />
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-4">

        {/* Timer */}
        <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-2 bg-emerald-500/15 border border-emerald-500/30 rounded-full">
          <FaClock className="text-emerald-400 text-xs" />
          <span className="text-xs text-emerald-400 font-mono font-bold">
            01:24:05
          </span>
        </div>

        {/* Notifications */}
        <button className="p-2.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200 relative">
          <FaBell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        </button>

        {/* Profile */}
        <div className="flex items-center gap-3">
          <span className="hidden md:block text-sm text-white/70 font-medium">
            {user?.name}
          </span>
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow-lg hover:shadow-indigo-500/50 transition-shadow duration-200">
            {user?.name?.[0] || "U"}
          </div>
        </div>

        <LogoutButton variant="dropdown" />
      </div>
    </header>

    {/* Invite modal — rendered outside header to avoid z-index stacking issues */}
    {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
    {showMembers && <WorkspaceMembersModal onClose={() => setShowMembers(false)} />}
  </>
  );
}