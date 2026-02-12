import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProjectsBySpace, setActiveProject } from "../../features/projects/projectSlice";
import { useNavigate, useParams } from "react-router-dom";

export default function ProjectsSubSidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { projectId } = useParams();

  const { activeSpace } = useSelector((s) => s.spaces);
  const { projects, activeProject } = useSelector((s) => s.projects);

  // Fetch projects when activeSpace changes
  useEffect(() => {
    if (activeSpace?._id) {
      dispatch(fetchProjectsBySpace(activeSpace._id));
    }
  }, [activeSpace, dispatch]);

  const handleSelectProject = (project) => {
    dispatch(setActiveProject(project));
    navigate(`/projects/${project._id}`);
  };

  return (
    <aside className="hidden md:flex w-60 bg-[var(--color-card)] border-r border-white/10 flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h3 className="text-sm font-semibold">Projects</h3>
        {activeSpace && (
          <p className="text-xs opacity-60 mt-1">{activeSpace.name}</p>
        )}
      </div>

      {/* Projects list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {projects.map((project) => (
          <div
            key={project._id}
            onClick={() => handleSelectProject(project)}
            className={`px-3 py-2 rounded-md text-sm cursor-pointer hover:bg-white/5
              ${
                projectId === project._id || activeProject?._id === project._id
                  ? "bg-white/10"
                  : ""
              }`}
          >
            {project.name}
          </div>
        ))}

        {!projects.length && (
          <p className="text-xs opacity-50">No projects yet</p>
        )}
      </div>
    </aside>
  );
}
