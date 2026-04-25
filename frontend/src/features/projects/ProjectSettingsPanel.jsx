import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { deleteProject, fetchProjectsBySpace, setActiveProject, updateProject } from "./projectSlice";
import { canManageProject } from "../../utils/roles";

export default function ProjectSettingsPanel() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { activeProject } = useSelector((s) => s.projects);
  const { activeSpace } = useSelector((s) => s.spaces);

  const projectId = activeProject?._id;
  const myRole = activeProject?.myRole ?? null;
  const canManage = canManageProject(myRole);

  const [name, setName] = useState(activeProject?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setName(activeProject?.name ?? "");
  }, [activeProject?._id, activeProject?.name]);

  const trimmed = name.trim();
  const nameChanged = trimmed && trimmed !== (activeProject?.name ?? "");
  const nameInvalid = !trimmed;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!projectId || nameInvalid || !nameChanged) return;
    setSaving(true);
    try {
      await dispatch(updateProject({ id: projectId, data: { name: trimmed } })).unwrap();
      toast.success("Project name updated");
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to update project");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!projectId || !activeProject?.name) return;
    const ok = window.confirm(
      `Delete project "${activeProject.name}"? This cannot be undone. All tasks in this project will be removed.`,
    );
    if (!ok) return;
    setDeleting(true);
    try {
      await dispatch(deleteProject(projectId)).unwrap();
      dispatch(setActiveProject(null));
      if (activeSpace?._id) {
        dispatch(fetchProjectsBySpace(activeSpace._id));
      }
      toast.success("Project deleted");
      navigate("/projects", { replace: true });
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to delete project");
    } finally {
      setDeleting(false);
    }
  };

  if (!activeProject) {
    return (
      <div className="p-6 text-[13px] text-[var(--color-text-muted)]">No project selected.</div>
    );
  }

  if (!canManage) {
    return (
      <div className="p-6 text-[13px] text-[var(--color-text-secondary)]">
        Only project managers can change settings. Your role is read-only for this screen.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 p-6">
      <section className="space-y-3">
        <h3 className="text-[13px] font-semibold text-[var(--color-text-primary)]">General</h3>
        <form onSubmit={handleSave} className="space-y-3">
          <label className="block text-[11px] font-medium text-[var(--color-text-muted)]">
            Project name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="app-control mt-1.5 w-full placeholder:text-[var(--color-text-muted)]"
              placeholder="Project name"
              maxLength={120}
              autoComplete="off"
            />
          </label>
          <button
            type="submit"
            disabled={saving || !nameChanged || nameInvalid}
            className="rounded-md bg-[var(--color-primary)] px-3 py-1.5 text-[12px] font-medium text-white shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-red-200/80 bg-red-50/50 p-4 dark:border-red-500/25 dark:bg-red-950/20">
        <h3 className="text-[13px] font-semibold text-red-900 dark:text-red-200/90">Danger zone</h3>
        <p className="mt-1.5 text-[11px] leading-relaxed text-red-800/90 dark:text-red-200/70">
          Deleting removes this project and its board data from the workspace permanently.
        </p>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="mt-3 rounded-md border border-red-300 bg-white px-3 py-1.5 text-[12px] font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/40 dark:bg-red-950/30 dark:text-red-200 dark:hover:bg-red-950/50"
        >
          {deleting ? "Deleting…" : "Delete project"}
        </button>
      </section>
    </div>
  );
}
