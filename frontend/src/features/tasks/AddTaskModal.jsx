import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addTask } from "./tasksSlice";
import toast from "react-hot-toast";

const DEFAULT_COLUMNS = [
  { key: "todo",        name: "To Do" },
  { key: "in_progress", name: "In Progress" },
  { key: "done",        name: "Done" },
];

export default function AddTaskModal({ projectId, columns = DEFAULT_COLUMNS, onClose }) {
  const dispatch = useDispatch();
  const { activeProject } = useSelector((s) => s.projects);

  const projectMembers = useMemo(() => {
    if (!activeProject || activeProject?._id !== projectId) return [];
    return (activeProject.members || []).map((m) => m?.user).filter(Boolean);
  }, [activeProject, projectId]);

  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [status,      setStatus]      = useState(columns[0]?.key ?? "todo");
  const [assigneeId,  setAssigneeId]  = useState("");
  const [submitting,  setSubmitting]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await dispatch(addTask({
        title: title.trim(),
        description,
        projectId,
        status,
        assignee: assigneeId || null,
      })).unwrap();
      toast.success("Task created");
      onClose();
    } catch (err) {
      toast.error(err || "Failed to create task");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center px-4 py-10 sm:py-12 app-modal-backdrop">
      <div className="app-modal-panel w-full max-w-md overflow-hidden p-6 sm:p-7">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold tracking-tight text-[var(--color-text-primary)]">New Task</h3>
          <button type="button" onClick={onClose} className="rounded-[var(--radius-sm)] px-1.5 py-0.5 text-xl leading-none text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Title *</label>
            <input
              autoFocus
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-input-bg)] p-2.5 text-sm text-[var(--color-text-primary)] transition focus:border-indigo-500/55 focus:outline-none"
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Description</label>
            <textarea
              rows={3}
              className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-input-bg)] p-2.5 text-sm text-[var(--color-text-primary)] transition focus:border-indigo-500/55 focus:outline-none"
              placeholder="Optional description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Initial column</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full cursor-pointer rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-input-bg)] p-2.5 text-sm text-[var(--color-text-primary)] focus:border-indigo-500/55 focus:outline-none"
            >
              {columns.map((col) => (
                <option key={col.key} value={col.key}>{col.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Assignee</label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full cursor-pointer rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-input-bg)] p-2.5 text-sm text-[var(--color-text-primary)] focus:border-indigo-500/55 focus:outline-none"
            >
              <option value="">Unassigned</option>
              {projectMembers.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
            {activeProject?._id !== projectId && (
              <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                Loading project members…
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-2 text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="px-4 py-2 rounded-[var(--radius-md)] bg-indigo-600 hover:bg-[var(--color-primary-hover)] disabled:opacity-60 text-white text-sm font-medium shadow-lg shadow-indigo-600/20 transition"
            >
              {submitting ? "Creating…" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
