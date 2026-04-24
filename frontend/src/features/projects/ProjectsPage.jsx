import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProjectById } from "./projectSlice";
import { Outlet, useParams, Link } from "react-router-dom";
import {
  canManageProject,
  spaceRoleLabel,
  projectRoleLabel,
  projectRoleBadgeClass,
} from "../../utils/roles";
import ProjectMembersPanel from "./ProjectMembersPanel";

export default function ProjectsPage() {
  const dispatch = useDispatch();
  const { projectId } = useParams();

  const { activeProject, loading, error } = useSelector((s) => s.projects);
  const { activeSpaceRole }               = useSelector((s) => s.spaces);
  const [tab, setTab] = useState("board");

  const myRole = activeProject?.myRole ?? null;
  const canManage = canManageProject(myRole);

  const memberCountLabel = useMemo(() => {
    const n = activeProject?.members?.length ?? 0;
    return `${n} member${n !== 1 ? "s" : ""}`;
  }, [activeProject?.members?.length]);

  useEffect(() => {
    if (projectId) dispatch(fetchProjectById(projectId));
  }, [projectId, dispatch]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center gap-3 text-[var(--color-text-muted)]">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-border-strong)] border-t-indigo-500" />
        Loading project...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-[var(--color-text-muted)]">
        <p className="text-red-600/90 dark:text-red-400/70">{error}</p>
        <Link to="/projects" className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
          ← Back to projects
        </Link>
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-[var(--color-text-muted)]">
        <p className="text-lg text-[var(--color-text-secondary)]">Select a project from the sidebar</p>
        {activeSpaceRole && (
          <p className="text-xs text-[var(--color-text-muted)]">
            Your workspace role: {spaceRoleLabel(activeSpaceRole)}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {activeProject && (
        <div className="flex items-center gap-4 border-b border-[var(--color-border)] px-6 py-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold text-[var(--color-text-primary)]">{activeProject.name}</h2>
            {activeProject.myRole && (
              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                <span className="text-xs text-[var(--color-text-muted)]">Your role</span>
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${projectRoleBadgeClass(activeProject.myRole)}`}
                >
                  {projectRoleLabel(activeProject.myRole)}
                </span>
              </div>
            )}
          </div>

          {activeProject.members?.length > 0 && (
            <div className="hidden shrink-0 items-center sm:flex" aria-label="Project members">
              <div className="-space-x-2 flex items-center">
                {activeProject.members.slice(0, 8).map((m) => {
                  const u = m.user;
                  const tip = `${u?.name ?? "Member"} — ${projectRoleLabel(m.role)}`;
                  return (
                    <div
                      key={u?._id ?? m.user}
                      title={tip}
                      className="flex h-8 w-8 cursor-default items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-[11px] font-bold text-white ring-2 ring-[var(--color-bg)]"
                    >
                      {(u?.name?.[0] || u?.email?.[0] || "?").toUpperCase()}
                    </div>
                  );
                })}
              </div>
              {activeProject.members.length > 8 && (
                <span className="ml-2 text-[11px] text-[var(--color-text-muted)]">+{activeProject.members.length - 8}</span>
              )}
            </div>
          )}

          <span className="ml-auto shrink-0 text-xs text-[var(--color-text-muted)] sm:ml-2">{memberCountLabel}</span>

          {projectId && (
            <div className="flex overflow-hidden rounded-lg border border-[var(--color-border-strong)]">
              <button
                type="button"
                onClick={() => setTab("board")}
                className={`px-3 py-1.5 text-xs font-medium transition ${
                  tab === "board"
                    ? "bg-indigo-600 text-white"
                    : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]"
                }`}
              >
                Board
              </button>
              <button
                type="button"
                onClick={() => setTab("members")}
                disabled={!canManage}
                className={`px-3 py-1.5 text-xs font-medium transition ${
                  tab === "members"
                    ? "bg-indigo-600 text-white"
                    : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]"
                } ${!canManage ? "cursor-not-allowed opacity-50" : ""}`}
                title={!canManage ? "Manager role required" : "Manage project members"}
              >
                Members
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {tab === "members" ? <ProjectMembersPanel /> : <Outlet />}
      </div>
    </div>
  );
}
