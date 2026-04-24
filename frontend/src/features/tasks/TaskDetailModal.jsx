import { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { editTask, removeTask } from "./tasksSlice";
import { projectRoleBadgeClass, projectRoleLabel } from "../../utils/roles";

const PRIORITIES = [
  { key: "none", label: "None" },
  { key: "low", label: "Low" },
  { key: "medium", label: "Medium" },
  { key: "high", label: "High" },
  { key: "urgent", label: "Urgent" },
];

function toDateInputValue(dateLike) {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "";
  // Use local date (YYYY-MM-DD) for <input type="date" />
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateTime(dateLike) {
  if (!dateLike) return "—";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export default function TaskDetailModal({
  task,
  columns = [],
  projectMembers = [],
  canWrite,
  canManage,
  onClose,
}) {
  const dispatch = useDispatch();
  const [submitting, setSubmitting] = useState(false);

  const initial = useMemo(() => {
    const labels = Array.isArray(task?.labels) ? task.labels : [];
    return {
      title: task?.title ?? "",
      description: task?.description ?? "",
      status: task?.status ?? (columns?.[0]?.key ?? "todo"),
      assigneeId: task?.assignee?._id ?? task?.assignee ?? "",
      priority: task?.priority ?? "none",
      dueDate: toDateInputValue(task?.dueDate),
      labelsText: labels.join(", "),
    };
  }, [task, columns]);

  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [status, setStatus] = useState(initial.status);
  const [assigneeId, setAssigneeId] = useState(initial.assigneeId);
  const [priority, setPriority] = useState(initial.priority);
  const [dueDate, setDueDate] = useState(initial.dueDate);
  const [labelsText, setLabelsText] = useState(initial.labelsText);

  const projectMemberRoleByUserId = useMemo(() => {
    const map = new Map();
    (projectMembers || []).forEach((entry) => {
      const id = entry?.user?._id?.toString();
      if (id) map.set(id, entry.role);
    });
    return map;
  }, [projectMembers]);

  const selectedAssigneeRole = assigneeId
    ? projectMemberRoleByUserId.get(String(assigneeId)) ?? null
    : null;

  if (!task) return null;

  const handleSave = async (e) => {
    e?.preventDefault?.();
    if (!canWrite) return;
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    const labels = labelsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 5);

    const updates = {
      title: title.trim(),
      description,
      status,
      assignee: assigneeId ? assigneeId : null,
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      labels,
    };

    setSubmitting(true);
    try {
      await dispatch(editTask({ taskId: task._id, updates })).unwrap();
      toast.success("Task updated");
      onClose();
    } catch (err) {
      toast.error(err || "Failed to update task");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!canManage) return;
    if (!window.confirm("Delete this task?")) return;
    try {
      await dispatch(removeTask(task._id)).unwrap();
      toast.success("Task deleted");
      onClose();
    } catch (err) {
      toast.error(err || "Failed to delete task");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 px-4">
      <div className="bg-[var(--color-card)] border border-white/10 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="font-semibold text-lg text-white truncate">Task details</h3>
            <p className="text-xs text-white/40 truncate">
              {task.projectId?.name ? `Project: ${task.projectId.name}` : " "}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-[1fr_320px]">
          {/* Left */}
          <div className="p-6 space-y-5">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Title</label>
              <input
                disabled={!canWrite}
                className="w-full p-3 rounded-lg bg-[var(--color-bg)] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition disabled:opacity-70"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                required
              />
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1 block">Description</label>
              <textarea
                disabled={!canWrite}
                rows={8}
                className="w-full p-3 rounded-lg bg-[var(--color-bg)] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition resize-none disabled:opacity-70"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details..."
              />
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1 block">
                Labels <span className="text-white/30">(comma-separated, max 5)</span>
              </label>
              <input
                disabled={!canWrite}
                className="w-full p-3 rounded-lg bg-[var(--color-bg)] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition disabled:opacity-70"
                value={labelsText}
                onChange={(e) => setLabelsText(e.target.value)}
                placeholder="bug, frontend, urgent"
              />
            </div>

            <div className="pt-3 border-t border-white/10 text-xs text-white/40 space-y-1">
              <div>
                Created by: <span className="text-white/60">{task.createdBy?.name ?? "—"}</span>
              </div>
              <div>
                Created: <span className="text-white/60">{formatDateTime(task.createdAt)}</span>
              </div>
              <div>
                Updated: <span className="text-white/60">{formatDateTime(task.updatedAt)}</span>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="p-6 border-t md:border-t-0 md:border-l border-white/10 space-y-4 bg-black/10">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Status</label>
              <select
                disabled={!canWrite}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-[var(--color-bg)] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/50 cursor-pointer disabled:opacity-70"
              >
                {columns.map((col) => (
                  <option key={col.key} value={col.key}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1 block">Assignee</label>
              <select
                disabled={!canWrite}
                value={assigneeId || ""}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-[var(--color-bg)] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/50 cursor-pointer disabled:opacity-70"
              >
                <option value="">Unassigned</option>
                {(projectMembers || []).map((entry) => {
                  const u = entry?.user;
                  if (!u?._id) return null;
                  const roleLabel = projectRoleLabel(entry.role);
                  return (
                    <option key={u._id} value={u._id}>
                      {u.name} · {roleLabel}
                    </option>
                  );
                })}
              </select>
              {assigneeId && selectedAssigneeRole && (
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-[11px] text-white/40">Role in project</span>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full border text-[11px] font-medium ${projectRoleBadgeClass(selectedAssigneeRole)}`}
                  >
                    {projectRoleLabel(selectedAssigneeRole)}
                  </span>
                </div>
              )}
              {assigneeId && !selectedAssigneeRole && (
                <p className="text-[11px] text-white/30 mt-2">
                  Role badge unavailable (assignee may be a space admin not listed on this project).
                </p>
              )}
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1 block">Priority</label>
              <select
                disabled={!canWrite}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-[var(--color-bg)] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/50 cursor-pointer disabled:opacity-70"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1 block">Due date</label>
              <input
                disabled={!canWrite}
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-[var(--color-bg)] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/50 disabled:opacity-70"
              />
              <p className="text-[11px] text-white/30 mt-1">
                Stored as a date; rendered in your local timezone.
              </p>
            </div>

            <div className="pt-3 flex items-center justify-between gap-3">
              {canManage ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-200 hover:bg-red-500/20 text-sm transition"
                >
                  Delete
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-white/5 text-white/60 hover:text-white text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canWrite || submitting || !title.trim()}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium transition"
                >
                  {submitting ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

