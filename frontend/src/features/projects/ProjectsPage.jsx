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
import { ProjectPageSkeleton } from "../../components/ui/Skeleton";

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
    return <ProjectPageSkeleton />;
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
        <p className="text-lg text-[var(--color-text-secondary)]">
          Select a project from the <span className="font-medium text-[var(--color-text-primary)]">Project</span> menu in the header.
        </p>
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
        <div className="flex flex-wrap items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2.5 sm:px-5">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[15px] font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-base">
              {activeProject.name}
            </h2>
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
                      className="flex h-7 w-7 cursor-default items-center justify-center rounded-md bg-[var(--color-surface-muted)] text-[10px] font-semibold text-[var(--color-primary)] ring-2 ring-[var(--color-border-strong)]"
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

          <span className="ml-auto shrink-0 text-[11px] tabular-nums text-[var(--color-text-muted)] sm:ml-2">{memberCountLabel}</span>

          {projectId && (
            <div className="flex overflow-hidden rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface-muted)] p-0.5">
              <button
                type="button"
                onClick={() => setTab("board")}
                className={`rounded-[calc(var(--radius-sm)+1px)] px-2.5 py-1 text-[11px] font-medium capitalize transition-colors duration-150 ${
                  tab === "board"
                    ? "bg-[var(--color-card)] text-[var(--color-text-primary)] shadow-sm ring-1 ring-[var(--color-border)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                Board
              </button>
              <button
                type="button"
                onClick={() => setTab("members")}
                disabled={!canManage}
                className={`rounded-[calc(var(--radius-sm)+1px)] px-2.5 py-1 text-[11px] font-medium capitalize transition-colors duration-150 ${
                  tab === "members"
                    ? "bg-[var(--color-card)] text-[var(--color-text-primary)] shadow-sm ring-1 ring-[var(--color-border)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
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
