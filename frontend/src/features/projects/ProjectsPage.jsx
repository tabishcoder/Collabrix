import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProjectById } from "./projectSlice";
import { Outlet, useParams } from "react-router-dom";

export default function ProjectsPage() {
  const dispatch = useDispatch();
  const { projectId } = useParams();

  const { activeProject, loading } = useSelector((s) => s.projects);

  // Fetch project when URL changes
  useEffect(() => {
    if (projectId) {
      dispatch(fetchProjectById(projectId));
    }
  }, [projectId, dispatch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        Loading project...
      </div>
    );
  }

  if (!activeProject) {
    return (
      <div className="flex items-center justify-center h-full opacity-60">
        Select a project to view tasks
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Project Header */}
      <div className="px-6 py-4 border-b border-white/10">
        <h2 className="text-lg font-semibold">{activeProject.name}</h2>
      </div>

      {/* Kanban */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
