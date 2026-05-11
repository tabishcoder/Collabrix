import { useState, useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { setActiveProject, fetchProjectsBySpace, fetchProjectById } from "../features/projects/projectSlice";
import { resetTasks } from "../features/tasks/tasksSlice";
import { setActiveSpace } from "../features/spaces/spaceSlice";
import CreateProjectModal from "../features/projects/CreateProjectModal";
import CreateWorkspaceModal from "../features/spaces/CreateWorkspaceModal";
import {
  FaBars,
  FaChevronDown,
  FaSearch,
  FaFolder,
  FaPlus,
  FaCheckCircle,
  FaUserPlus,
  FaChevronRight,
  FaUserCircle,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";

import { logout } from "../features/auth/authSlice";
import { disconnectSocket } from "../services/socket";
import toast from "react-hot-toast";
import InviteModal from "../features/invites/InviteModal";
import WorkspaceMembersModal from "../features/spaces/WorkspaceMembersModal";
import { canManageSpace, spaceRoleLabel, spaceRoleBadgeClass, isPlatformAdmin } from "../utils/roles";
import ThemeToggle from "../theme/ThemeToggle";
import GlobalSearch from "./GlobalSearch";
import NotificationsBell from "./NotificationsBell";

/** Shared trigger style — neutral “breadcrumb control” */
const chromeTrigger =
  "inline-flex max-w-[200px] items-center gap-2 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-card)] px-2.5 py-1.5 text-left shadow-sm transition-colors duration-150 hover:border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] sm:max-w-[240px] sm:px-3 sm:py-2";

export default function TopNavbar({ onToggleSidebar }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { activeSpace, activeSpaceRole, spaces } = useSelector((s) => s.spaces);
  const { activeProject, projects } = useSelector((s) => s.projects);

  const [openDropdown, setOpenDropdown] = useState(null);
  const [projectSearch, setProjectSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);

  const isSpaceAdmin = canManageSpace(activeSpaceRole);

  useEffect(() => {
    if (activeSpace?._id) dispatch(fetchProjectsBySpace(activeSpace._id));
  }, [dispatch, activeSpace?._id]);

  const filteredProjects = useMemo(
    () =>
      projects?.filter((p) => p.name.toLowerCase().includes(projectSearch.toLowerCase())) || [],
    [projects, projectSearch],
  );

  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      disconnectSocket();
      toast.success("Logged out successfully");
      navigate("/login", { replace: true });
    } catch (err) {
      disconnectSocket();
      toast.error(err || "Logout failed");
    } finally {
      setOpenDropdown(null);
    }
  };

  const shouldKeepRouteWhenSwitchingProject = (pathname) => {
    if (!pathname) return false;
    // These modules are project-scoped but don't carry projectId in the URL.
    return (
      pathname.startsWith("/chats") ||
      pathname.startsWith("/meetings") ||
      pathname.startsWith("/aibot") ||
      pathname.startsWith("/admin")
    );
  };

  return (
    <>
      <header className="sticky top-0 z-[100] flex min-w-0 shrink-0 items-center justify-between gap-2 overflow-visible border-b border-[var(--color-border)] bg-[var(--color-card)] px-2 py-2 shadow-[var(--shadow-nav)] sm:h-14 sm:px-3 md:px-5 lg:px-6">

        {/* LEFT — breadcrumb-style context */}
        <div className="flex min-w-0 flex-1 items-center gap-1.5 md:gap-3">

          <button
            type="button"
            onClick={onToggleSidebar}
            className="rounded-md p-2 text-[var(--color-text-secondary)] transition-colors duration-150 hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] lg:hidden"
          >
            <FaBars size={18} />
          </button>

          <div className="flex min-w-0 items-center gap-1 sm:gap-1.5">
            {/* Workspace */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => toggleDropdown("workspace")}
                className={chromeTrigger}
                aria-expanded={openDropdown === "workspace"}
                aria-haspopup="true"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[var(--color-surface-muted)] text-[10px] font-semibold text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]">
                  {activeSpace?.name?.[0] || "W"}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[var(--color-text-primary)]">
                  {activeSpace?.name || "Workspace"}
                </span>
                {activeSpaceRole && (
                  <span
                    className={`hidden shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium sm:inline-flex ${spaceRoleBadgeClass(activeSpaceRole)}`}
                    title={spaceRoleLabel(activeSpaceRole)}
                  >
                    {spaceRoleLabel(activeSpaceRole)}
                  </span>
                )}
                <FaChevronDown
                  className={`shrink-0 text-[10px] text-[var(--color-text-muted)] transition-transform duration-150 ${
                    openDropdown === "workspace" ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openDropdown === "workspace" && (
                <div className="absolute left-0 z-[200] mt-1.5 w-64 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-dropdown-bg)] p-1.5 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.05]">
                  <p className="px-2.5 py-1.5 text-[11px] font-medium text-[var(--color-text-muted)]">Workspace</p>
                  {isPlatformAdmin(user) && (
                    <p className="px-2.5 pb-1.5 text-[10px] leading-snug text-amber-800/90 dark:text-amber-200/80">
                      Platform admin — switch tenant context here.
                    </p>
                  )}

                  <div className="max-h-52 overflow-y-auto p-0.5">
                    {(!spaces || spaces.length === 0) && (
                      <p className="px-2 py-2 text-[12px] text-[var(--color-text-muted)]">No workspaces yet.</p>
                    )}
                    {(spaces || []).map((s) => (
                      <button
                        key={s._id}
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          dispatch(setActiveSpace(s));
                        }}
                        className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-[13px] font-medium text-[var(--color-text-primary)] transition-colors duration-150 hover:bg-[var(--color-surface-hover)]"
                      >
                        <span className="min-w-0 truncate">{s.name}</span>
                        {activeSpace?._id === s._id && (
                          <FaCheckCircle className="shrink-0 text-xs text-[var(--color-primary)]" aria-label="Active" />
                        )}
                      </button>
                    ))}
                  </div>

                  {activeSpace && isSpaceAdmin && (
                    <>
                      <div className="my-1 h-px bg-[var(--color-border)]" />
                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          setShowMembers(true);
                        }}
                        className="w-full rounded-md px-2.5 py-2 text-left text-[13px] text-[var(--color-text-secondary)] transition-colors duration-150 hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
                      >
                        Manage members
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          setShowInvite(true);
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] font-medium text-[var(--color-primary)] transition-colors duration-150 hover:bg-[color-mix(in_oklab,var(--color-primary)_10%,transparent)]"
                      >
                        <FaUserPlus className="text-xs opacity-80" />
                        Invite members
                      </button>
                    </>
                  )}

                  <div className="my-1 h-px bg-[var(--color-border)]" />

                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown(null);
                      setShowCreateWorkspace(true);
                    }}
                    className="w-full rounded-md px-2.5 py-2 text-left text-[13px] font-medium text-[var(--color-text-secondary)] transition-colors duration-150 hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
                  >
                    + New workspace
                  </button>
                </div>
              )}
            </div>

            {activeSpace ? (
              <>
                <FaChevronRight className="hidden shrink-0 text-[9px] text-[var(--color-text-muted)] opacity-70 sm:block" aria-hidden />

                {/* Project */}
                <div className="relative min-w-0 shrink">
                  <button
                    type="button"
                    onClick={() => toggleDropdown("project")}
                    className={`${chromeTrigger} max-w-[min(12rem,calc(100vw-8rem))]`}
                    aria-expanded={openDropdown === "project"}
                    aria-haspopup="true"
                  >
                    <FaFolder className="shrink-0 text-[13px] text-[var(--color-text-muted)]" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[var(--color-text-primary)]">
                      {activeProject?.name || "Select project"}
                    </span>
                    <FaChevronDown
                      className={`shrink-0 text-[10px] text-[var(--color-text-muted)] transition-transform duration-150 ${
                        openDropdown === "project" ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {openDropdown === "project" && (
                    <div className="absolute left-0 z-[200] mt-1.5 w-[min(calc(100vw-1.5rem),18rem)] overflow-hidden rounded-md border border-[var(--color-border-strong)] bg-[var(--color-dropdown-bg)] shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.05] sm:left-auto sm:right-0">

                      <div className="border-b border-[var(--color-border)] p-2.5">
                        <div className="relative">
                          <FaSearch className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[var(--color-text-muted)]" />
                          <input
                            autoFocus
                            value={projectSearch}
                            onChange={(e) => setProjectSearch(e.target.value)}
                            placeholder="Search projects…"
                            className="app-control w-full py-1.5 pl-8 pr-2.5 text-[13px] placeholder:text-[var(--color-text-muted)]"
                          />
                        </div>
                      </div>

                      <div className="max-h-56 overflow-y-auto p-1">
                        {filteredProjects.map((p) => (
                          <button
                            type="button"
                            key={p._id}
                            onClick={() => {
                              setOpenDropdown(null);
                              const prevId = activeProject?._id;
                              if (prevId !== p._id) {
                                dispatch(resetTasks());
                              }
                              dispatch(setActiveProject(p));
                              const stay = shouldKeepRouteWhenSwitchingProject(location.pathname);
                              if (stay) {
                                dispatch(fetchProjectById(p._id));
                              } else {
                                navigate(`/projects/${p._id}`);
                              }
                            }}
                            className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-[13px] text-[var(--color-text-secondary)] transition-colors duration-150 hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
                          >
                            <span className="min-w-0 truncate font-medium">{p.name}</span>
                            {p._id === activeProject?._id && (
                              <FaCheckCircle className="shrink-0 text-xs text-[var(--color-primary)]" />
                            )}
                          </button>
                        ))}
                      </div>

                      {isSpaceAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setOpenDropdown(null);
                            setShowCreateProject(true);
                          }}
                          className="flex w-full items-center justify-center gap-2 border-t border-[var(--color-border)] px-2.5 py-2.5 text-[12px] font-semibold text-[var(--color-primary)] transition-colors duration-150 hover:bg-[var(--color-surface-muted)]"
                        >
                          <FaPlus className="text-[10px]" />
                          New project
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="hidden max-w-[14rem] truncate text-[11px] leading-snug text-[var(--color-text-muted)] sm:block">
                Pick or create a workspace to enable projects and scoped modules.
              </p>
            )}
          </div>
        </div>

        <GlobalSearch spaceId={activeSpace?._id} />

        {/* RIGHT */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">

          <ThemeToggle />

          <NotificationsBell />

          <div className="relative ml-0.5 pl-1">
            <button
              type="button"
              onClick={() => toggleDropdown("profile")}
              aria-expanded={openDropdown === "profile"}
              aria-haspopup="true"
              className="flex items-center gap-2 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-card)] px-2 py-1.5 text-[13px] font-medium text-[var(--color-text-secondary)] shadow-sm transition-colors duration-150 hover:border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]"
              title={user?.email || "Account"}
            >
              <span className="hidden max-w-[8rem] truncate lg:block">{user?.name || "Account"}</span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--color-primary)] text-[11px] font-semibold text-white">
                {user?.name?.[0] || "U"}
              </span>
              <FaChevronDown
                className={`shrink-0 text-[10px] text-[var(--color-text-muted)] transition-transform duration-150 ${
                  openDropdown === "profile" ? "rotate-180" : ""
                }`}
              />
            </button>

            {openDropdown === "profile" && (
              <div className="absolute right-0 z-[200] mt-2 w-56 overflow-hidden rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-dropdown-bg)] shadow-xl ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
                <div className="border-b border-[var(--color-border)] px-3 py-2.5">
                  <div className="truncate text-[13px] font-semibold text-[var(--color-text-primary)]">{user?.name || "Account"}</div>
                  <div className="truncate text-[12px] text-[var(--color-text-muted)]">{user?.email || ""}</div>
                </div>

                <div className="p-1">
                  <button
                    type="button"
                    onClick={() => {
                      navigate("/profile");
                      setOpenDropdown(null);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] text-[var(--color-text-secondary)] transition-colors duration-150 hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
                  >
                    <FaUserCircle className="text-[13px] opacity-80" aria-hidden />
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigate("/settings");
                      setOpenDropdown(null);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] text-[var(--color-text-secondary)] transition-colors duration-150 hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
                  >
                    <FaCog className="text-[13px] opacity-80" aria-hidden />
                    Settings
                  </button>

                  <div className="my-1 h-px bg-[var(--color-border)]" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] font-medium text-red-700 transition-colors duration-150 hover:bg-red-500/[0.08] dark:text-red-300"
                  >
                    <FaSignOutAlt className="text-[13px] opacity-90" aria-hidden />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
      {showMembers && <WorkspaceMembersModal onClose={() => setShowMembers(false)} />}
      {showCreateProject && <CreateProjectModal onClose={() => setShowCreateProject(false)} />}
      {showCreateWorkspace && <CreateWorkspaceModal onClose={() => setShowCreateWorkspace(false)} />}
    </>
  );
}
