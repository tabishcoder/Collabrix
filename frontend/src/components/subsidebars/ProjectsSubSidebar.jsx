import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaFolder, FaPlus, FaSpinner } from "react-icons/fa";
import toast from "react-hot-toast";

import { fetchProjectsBySpace, createProject, setActiveProject } from "../../features/projects/projectSlice";
import { SPACE_ADMIN_ROLES } from "../../utils/roles";

export default function ProjectsSubSidebar({ collapsed }) {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();

  const { activeSpace, activeSpaceRole }       = useSelector((s) => s.spaces);
  const { projects, loading, error } = useSelector((s) => s.projects);

  const [showCreate, setShowCreate] = useState(false);
  const [newName,    setNewName]    = useState("");
  const [creating,   setCreating]   = useState(false);

  const canCreate = SPACE_ADMIN_ROLES.includes(activeSpaceRole);

  // Fetch when active space changes
  useEffect(() => {
    if (activeSpace?._id) dispatch(fetchProjectsBySpace(activeSpace._id));
  }, [dispatch, activeSpace?._id]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const result = await dispatch(
        createProject({ name: newName.trim(), spaceId: activeSpace._id })
      ).unwrap();
      toast.success("Project created");
      setNewName("");
      setShowCreate(false);
      navigate(`/projects/${result._id}`);
    } catch (err) {
      toast.error(err || "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  return (
    <aside
      className={`
        h-screen flex flex-col
        bg-[var(--color-card)]
        border-r border-white/10
        transition-all duration-300
        ${collapsed ? "w-20" : "w-64"}
      `}
    >
      {/* HEADER */}
      <div className="p-4 border-b border-white/10">
        {collapsed ? (
          <div className="text-center text-lg">📁</div>
        ) : (
          <>
            <h3 className="text-sm font-semibold text-white/80">Projects</h3>
            <p className="text-xs text-white/40 mt-1 truncate">
              {activeSpace?.name || "Workspace"}
            </p>
          </>
        )}
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading && (
          <div className="flex items-center justify-center py-6">
            <FaSpinner className="animate-spin text-white/30" />
          </div>
        )}

        {error && !loading && (
          <p className="text-xs text-red-400 px-3 py-2">{error}</p>
        )}

        {!loading && !error && projects.length === 0 && (
          <p className="text-xs text-white/30 px-3 py-4 text-center">
            {canCreate ? "No projects yet. Create one!" : "No projects yet."}
          </p>
        )}

        {!loading && projects.map((project) => (
          <NavLink
            key={project._id}
            to={`/projects/${project._id}`}
            onClick={() => dispatch(setActiveProject(project))}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all duration-150 cursor-pointer
               ${isActive
                 ? "bg-indigo-600/30 text-indigo-300 font-medium"
                 : "text-white/60 hover:bg-white/5 hover:text-white/90"
               }`
            }
          >
            <FaFolder className="shrink-0 text-xs" />
            {!collapsed && (
              <span className="truncate">{project.name}</span>
            )}
          </NavLink>
        ))}
      </div>

      {/* NEW PROJECT */}
      {canCreate && (
        <div className="p-3 border-t border-white/10">
          {showCreate && !collapsed ? (
            <form onSubmit={handleCreate} className="space-y-2">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Project name"
                className="w-full px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-indigo-500/50"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={creating || !newName.trim()}
                  className="flex-1 py-1.5 rounded-md bg-indigo-600 text-white text-xs font-medium disabled:opacity-50 hover:bg-indigo-500 transition"
                >
                  {creating ? "Creating…" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setNewName(""); }}
                  className="px-3 py-1.5 rounded-md bg-white/5 text-white/50 text-xs hover:bg-white/10 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => !collapsed && setShowCreate(true)}
              className="w-full flex items-center justify-center gap-2 px-2 py-2 rounded-md bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-sm font-medium transition"
              title="New Project"
            >
              <FaPlus className="text-xs" />
              {!collapsed && "New Project"}
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
