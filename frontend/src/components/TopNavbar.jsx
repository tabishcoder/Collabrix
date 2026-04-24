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
import ThemeToggle from "../theme/ThemeToggle";

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
    <header className="h-16 shrink-0 z-50 sticky top-0 flex items-center justify-between px-4 md:px-6 lg:px-8 border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-card)_88%,transparent)] backdrop-blur-lg shadow-[var(--shadow-nav)]">

      {/* LEFT SECTION */}
      <div className="flex items-center gap-6">

        {/* Mobile Menu */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-[var(--color-text-secondary)] transition-colors duration-200 hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] md:hidden"
        >
          <FaBars size={18} />
        </button>

        {/* WORKSPACE + PROJECT */}
        <div className="flex items-center gap-3">

          {/* 🔵 WORKSPACE */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown("workspace")}
              className="flex items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-600/15 px-4 py-2.5 font-medium transition-all duration-200 hover:bg-indigo-600/25 dark:border-indigo-500/30"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-[11px] font-bold text-white">
                {activeSpace?.name?.[0] || "W"}
              </div>

              <div className="hidden flex-col leading-tight lg:flex">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                  Workspace
                </span>
                <span className="text-sm font-bold text-indigo-950 dark:text-indigo-100">
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
                className={`text-xs text-[var(--color-text-muted)] transition ${
                  openDropdown === "workspace" ? "rotate-180" : ""
                }`}
              />
            </button>

            {openDropdown === "workspace" && (
              <div className="absolute left-0 mt-3 w-60 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-dropdown-bg)] p-2 shadow-lg backdrop-blur-sm">
                <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Workspaces
                </p>

                <button
                  type="button"
                  className="w-full rounded-md px-3 py-2.5 text-left font-medium text-[var(--color-text-primary)] transition-colors duration-150 hover:bg-indigo-600/15 dark:hover:bg-indigo-600/20"
                >
                  {activeSpace?.name}
                </button>

                {/* Invite Members — admin/owner only */}
                {isSpaceAdmin && (
                  <>
                    <div className="my-1.5 h-px bg-[var(--color-border)]" />
                    <button
                      type="button"
                      onClick={() => { setOpenDropdown(null); setShowMembers(true); }}
                      className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-sm text-[var(--color-text-secondary)] transition-colors duration-150 hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
                    >
                      Manage Members
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOpenDropdown(null); setShowInvite(true); }}
                      className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-sm text-indigo-700 transition-colors duration-150 hover:bg-indigo-600/15 hover:text-indigo-900 dark:text-indigo-300 dark:hover:text-indigo-200"
                    >
                      <FaUserPlus className="text-xs" />
                      Invite Members
                    </button>
                  </>
                )}

                <div className="my-1.5 h-px bg-[var(--color-border)]" />

                <button
                  type="button"
                  className="w-full rounded-md px-3 py-2.5 text-left text-sm text-[var(--color-text-secondary)] transition-colors duration-150 hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
                >
                  + New Workspace
                </button>
              </div>
            )}
          </div>

          {/* DOT SEPARATOR */}
          <div className="h-1 w-1 rounded-full bg-[var(--color-text-muted)]" />

          {/* 🟢 PROJECT */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown("project")}
              className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/12 px-4 py-2.5 font-medium transition-all duration-200 hover:bg-emerald-500/20"
            >
              <FaFolder className="text-sm text-emerald-600 dark:text-emerald-400" />

              <div className="flex flex-col leading-tight">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Project
                </span>
                <span className="max-w-[120px] truncate text-sm font-bold text-[var(--color-text-primary)]">
                  {activeProject?.name || "Select Project"}
                </span>
              </div>

              <FaChevronDown
                className={`text-xs text-[var(--color-text-muted)] transition ${
                  openDropdown === "project" ? "rotate-180" : ""
                }`}
              />
            </button>

            {openDropdown === "project" && (
              <div className="absolute left-0 mt-3 w-72 overflow-hidden rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-dropdown-bg)] shadow-lg backdrop-blur-sm">

                {/* Search */}
                <div className="border-b border-[var(--color-border)] p-3">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-muted)]" />
                    <input
                      autoFocus
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      placeholder="Search project..."
                      className="w-full rounded-md border border-[var(--color-border-strong)] bg-[var(--color-input-bg)] py-2 pl-8 pr-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all duration-150"
                    />
                  </div>
                </div>

                {/* List */}
                <div className="max-h-60 overflow-y-auto p-1.5">
                  {filteredProjects.map((p) => (
                    <button
                      type="button"
                      key={p._id}
                      onClick={() => {
                        dispatch(setActiveProject(p));
                        navigate(`/projects/${p._id}`);
                        setOpenDropdown(null);
                      }}
                      className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm text-[var(--color-text-secondary)] transition-colors duration-150 hover:bg-emerald-600/20 hover:text-[var(--color-text-primary)] dark:hover:bg-emerald-600/25"
                    >
                      <span className="font-medium">{p.name}</span>
                      {p._id === activeProject?._id && (
                        <FaCheckCircle className="text-xs text-emerald-600 dark:text-emerald-400" />
                      )}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="w-full border-t border-[var(--color-border)] px-4 py-3 text-xs font-semibold text-emerald-700 transition-colors duration-150 hover:bg-[var(--color-surface-muted)] dark:text-emerald-400 dark:hover:bg-white/[0.06]"
                >
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
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search anything..."
            className="w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-input-bg)] py-2.5 pl-9 pr-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all duration-150"
          />
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-4">

        {/* Timer */}
        <div className="hidden items-center gap-2.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3.5 py-2 sm:flex">
          <FaClock className="text-xs text-emerald-600 dark:text-emerald-400" />
          <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
            01:24:05
          </span>
        </div>

        <ThemeToggle />

        {/* Notifications */}
        <button
          type="button"
          className="relative rounded-lg p-2.5 text-[var(--color-text-secondary)] transition-colors duration-200 hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
        >
          <FaBell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        </button>

        {/* Profile */}
        <div className="flex items-center gap-3">
          <span className="hidden text-sm font-medium text-[var(--color-text-secondary)] md:block">
            {user?.name}
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 text-xs font-bold text-white shadow-lg transition-shadow duration-200 hover:shadow-indigo-500/50">
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