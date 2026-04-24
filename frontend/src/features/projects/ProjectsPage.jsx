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
  const [tab, setTab] = useState("board"); // board | members

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
      <div className="flex items-center justify-center h-full gap-3 text-white/40">
        <div className="w-4 h-4 border-2 border-white/20 border-t-indigo-400 rounded-full animate-spin" />
        Loading project...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-white/40">
        <p className="text-red-400/70">{error}</p>
        <Link to="/projects" className="text-sm text-indigo-400 hover:underline">
          ← Back to projects
        </Link>
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-white/30">
        <p className="text-lg">Select a project from the sidebar</p>
        {activeSpaceRole && (
          <p className="text-xs text-white/20">
            Your workspace role: {spaceRoleLabel(activeSpaceRole)}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Project header */}
      {activeProject && (
        <div className="px-6 py-3 border-b border-white/8 flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-white truncate">{activeProject.name}</h2>
            {activeProject.myRole && (
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs text-white/30">Your role</span>
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full border text-[11px] font-medium ${projectRoleBadgeClass(activeProject.myRole)}`}
                >
                  {projectRoleLabel(activeProject.myRole)}
                </span>
              </div>
            )}
          </div>

          {/* Member avatars — hover shows project role (D1) */}
          {activeProject.members?.length > 0 && (
            <div className="hidden sm:flex items-center shrink-0" aria-label="Project members">
              <div className="flex items-center -space-x-2">
                {activeProject.members.slice(0, 8).map((m) => {
                  const u = m.user;
                  const tip = `${u?.name ?? "Member"} — ${projectRoleLabel(m.role)}`;
                  return (
                    <div
                      key={u?._id ?? m.user}
                      title={tip}
                      className="w-8 h-8 rounded-full ring-2 ring-[#0a0a0b] bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-[11px] font-bold text-white cursor-default"
                    >
                      {(u?.name?.[0] || u?.email?.[0] || "?").toUpperCase()}
                    </div>
                  );
                })}
              </div>
              {activeProject.members.length > 8 && (
                <span className="ml-2 text-[11px] text-white/35">+{activeProject.members.length - 8}</span>
              )}
            </div>
          )}

          <span className="ml-auto sm:ml-2 text-xs text-white/25 shrink-0">{memberCountLabel}</span>

          {projectId && (
            <div className="flex rounded-lg border border-white/10 overflow-hidden">
              <button
                onClick={() => setTab("board")}
                className={`px-3 py-1.5 text-xs font-medium transition ${
                  tab === "board"
                    ? "bg-indigo-600 text-white"
                    : "bg-white/5 text-white/50 hover:bg-white/10"
                }`}
              >
                Board
              </button>
              <button
                onClick={() => setTab("members")}
                disabled={!canManage}
                className={`px-3 py-1.5 text-xs font-medium transition ${
                  tab === "members"
                    ? "bg-indigo-600 text-white"
                    : "bg-white/5 text-white/50 hover:bg-white/10"
                } ${!canManage ? "opacity-50 cursor-not-allowed" : ""}`}
                title={!canManage ? "Manager role required" : "Manage project members"}
              >
                Members
              </button>
            </div>
          )}
        </div>
      )}

      {/* Board / outlet */}
      <div className="flex-1 overflow-auto">
        {tab === "members" ? <ProjectMembersPanel /> : <Outlet />}
      </div>
    </div>
  );
}
