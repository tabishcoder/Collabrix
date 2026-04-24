import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProjectById } from "./projectSlice";
import { Outlet, useParams, Link } from "react-router-dom";
import { spaceRoleLabel, projectRoleLabel } from "../../utils/roles";

export default function ProjectsPage() {
  const dispatch = useDispatch();
  const { projectId } = useParams();

  const { activeProject, loading, error } = useSelector((s) => s.projects);
  const { activeSpaceRole }               = useSelector((s) => s.spaces);

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
          <div>
            <h2 className="text-base font-semibold text-white">{activeProject.name}</h2>
            {activeProject.myRole && (
              <span className="text-xs text-white/30">
                Your role: {projectRoleLabel(activeProject.myRole)}
              </span>
            )}
          </div>
          <span className="ml-auto text-xs text-white/25">
            {activeProject.members?.length ?? 0} member{activeProject.members?.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Board / outlet */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
