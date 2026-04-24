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
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 px-4">
      <div className="bg-[var(--color-card)] border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-lg text-white">New Task</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-white/50 mb-1 block">Title *</label>
            <input
              autoFocus
              className="w-full p-2.5 rounded-lg bg-[var(--color-bg)] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition"
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs text-white/50 mb-1 block">Description</label>
            <textarea
              rows={3}
              className="w-full p-2.5 rounded-lg bg-[var(--color-bg)] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition resize-none"
              placeholder="Optional description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-white/50 mb-1 block">Initial column</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-[var(--color-bg)] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/50 cursor-pointer"
            >
              {columns.map((col) => (
                <option key={col.key} value={col.key}>{col.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-white/50 mb-1 block">Assignee</label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-[var(--color-bg)] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/50 cursor-pointer"
            >
              <option value="">Unassigned</option>
              {projectMembers.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
            {activeProject?._id !== projectId && (
              <p className="text-[11px] text-white/30 mt-1">
                Loading project members…
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/5 text-white/60 hover:text-white text-sm transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium transition"
            >
              {submitting ? "Creating…" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
