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
        h-full min-h-0 flex flex-col shrink-0
        bg-[color-mix(in_oklab,var(--color-card)_96%,transparent)]
        border-r border-[var(--color-border-strong)]
        transition-all duration-300
        ${collapsed ? "w-20" : "w-64"}
      `}
    >
      {/* HEADER */}
      <div className="p-4 border-b border-[var(--color-border)]">
        {collapsed ? (
          <div className="text-center text-lg">📁</div>
        ) : (
          <>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Projects</h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-1 truncate">
              {activeSpace?.name || "Workspace"}
            </p>
          </>
        )}
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading && (
          <div className="flex items-center justify-center py-6">
            <FaSpinner className="animate-spin text-[var(--color-text-muted)]" />
          </div>
        )}

        {error && !loading && (
          <p className="text-xs text-red-400 px-3 py-2">{error}</p>
        )}

        {!loading && !error && projects.length === 0 && (
          <p className="px-3 py-4 text-center text-xs text-[var(--color-text-muted)]">
            {canCreate ? "No projects yet. Create one!" : "No projects yet."}
          </p>
        )}

        {!loading && projects.map((project) => (
          <NavLink
            key={project._id}
            to={`/projects/${project._id}`}
            onClick={() => dispatch(setActiveProject(project))}
            className={({ isActive }) =>
              `flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150
               ${isActive
                 ? "bg-indigo-100 text-indigo-900 dark:bg-indigo-600/30 dark:text-indigo-300"
                 : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
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
        <div className="border-t border-[var(--color-border)] p-3">
          {showCreate && !collapsed ? (
            <form onSubmit={handleCreate} className="space-y-2">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Project name"
                className="w-full rounded-md border border-[var(--color-border-strong)] bg-[var(--color-input-bg)] px-3 py-1.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-indigo-500/50"
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
                  className="rounded-md bg-[var(--color-surface-muted)] px-3 py-1.5 text-xs text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => !collapsed && setShowCreate(true)}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600/20 px-2 py-2 text-sm font-medium text-indigo-800 transition hover:bg-indigo-600/30 dark:text-indigo-300"
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
