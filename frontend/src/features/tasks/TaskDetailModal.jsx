import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { editTask, removeTask, addTaskComment } from "./tasksSlice";
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
  const [commentText, setCommentText] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);

  useEffect(() => {
    if (!task?._id) return;
    const labels = Array.isArray(task.labels) ? task.labels : [];
    setTitle(task.title ?? "");
    setDescription(task.description ?? "");
    setStatus(task.status ?? (columns?.[0]?.key ?? "todo"));
    setAssigneeId(task.assignee?._id ?? task.assignee ?? "");
    setPriority(task.priority ?? "none");
    setDueDate(toDateInputValue(task.dueDate));
    setLabelsText(labels.join(", "));
    setCommentText("");
  }, [task?._id, columns]);

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

  const handleAddComment = async (e) => {
    e?.preventDefault?.();
    if (!canWrite) return;
    const text = commentText.trim();
    if (!text) {
      toast.error("Write a comment first");
      return;
    }
    setCommentBusy(true);
    try {
      await dispatch(addTaskComment({ taskId: task._id, text })).unwrap();
      setCommentText("");
      toast.success("Comment added");
    } catch (err) {
      toast.error(err || "Failed to add comment");
    } finally {
      setCommentBusy(false);
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
    <div className="fixed inset-0 z-50 flex justify-center items-center px-4 py-6 sm:py-10 app-modal-backdrop">
      <div className="app-modal-panel w-full max-w-5xl max-h-[min(92dvh,920px)] overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-card)_92%,transparent)] px-6 py-4 backdrop-blur-md">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold tracking-tight text-[var(--color-text-primary)]">Task details</h3>
            <p className="truncate text-xs text-[var(--color-text-secondary)]">
              {task.projectId?.name ? `Project: ${task.projectId.name}` : " "}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="app-modal-close"
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
              <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Title</label>
              <input
                disabled={!canWrite}
                className="app-control px-3 py-3"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                required
              />
            </div>

            <div>
              <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Description</label>
              <textarea
                disabled={!canWrite}
                rows={8}
                className="app-control resize-none px-3 py-3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details..."
              />
            </div>

            <div>
              <label className="text-xs text-[var(--color-text-muted)] mb-1 block">
                Labels <span className="text-[var(--color-text-muted)]">(comma-separated, max 5)</span>
              </label>
              <input
                disabled={!canWrite}
                className="app-control px-3 py-3"
                value={labelsText}
                onChange={(e) => setLabelsText(e.target.value)}
                placeholder="bug, frontend, urgent"
              />
            </div>

            <div className="border-t border-[var(--color-border)] pt-5">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                Comments
              </h4>
              <ul className="mb-3 max-h-52 space-y-3 overflow-y-auto pr-1">
                {(Array.isArray(task.comments) ? task.comments : []).length === 0 && (
                  <li className="text-[12px] text-[var(--color-text-muted)]">No comments yet.</li>
                )}
                {(Array.isArray(task.comments) ? task.comments : []).map((c) => (
                  <li
                    key={c._id || `${c.author?._id}-${c.createdAt}`}
                    className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)]/50 px-3 py-2"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-[12px] font-semibold text-[var(--color-text-primary)]">
                        {c.author?.name || "Member"}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-muted)]">{formatDateTime(c.createdAt)}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
                      {c.text}
                    </p>
                  </li>
                ))}
              </ul>
              {canWrite ? (
                <form onSubmit={handleAddComment} className="space-y-2">
                  <textarea
                    rows={3}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment…"
                    className="app-control resize-none px-3 py-2 text-[13px] placeholder:text-[var(--color-text-muted)]"
                  />
                  <button
                    type="submit"
                    disabled={commentBusy || !commentText.trim()}
                    className="rounded-md bg-[var(--color-primary)] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
                  >
                    {commentBusy ? "Posting…" : "Post comment"}
                  </button>
                </form>
              ) : (
                <p className="text-[11px] text-[var(--color-text-muted)]">You can view comments but not add them.</p>
              )}
            </div>

            <div className="pt-3 border-t border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] space-y-1">
              <div>
                Created by: <span className="text-[var(--color-text-primary)]">{task.createdBy?.name ?? "—"}</span>
              </div>
              <div>
                Created: <span className="text-[var(--color-text-primary)]">{formatDateTime(task.createdAt)}</span>
              </div>
              <div>
                Updated: <span className="text-[var(--color-text-primary)]">{formatDateTime(task.updatedAt)}</span>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
            <div className="space-y-4 border-t border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-bg-elevated)_55%,var(--color-card))] p-6 md:border-l md:border-t-0">
            <div>
              <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Status</label>
              <select
                disabled={!canWrite}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="app-control cursor-pointer px-3 py-2.5"
              >
                {columns.map((col) => (
                  <option key={col.key} value={col.key}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Assignee</label>
              <select
                disabled={!canWrite}
                value={assigneeId || ""}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="app-control cursor-pointer px-3 py-2.5"
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
                  <span className="text-[11px] text-[var(--color-text-muted)]">Role in project</span>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full border text-[11px] font-medium ${projectRoleBadgeClass(selectedAssigneeRole)}`}
                  >
                    {projectRoleLabel(selectedAssigneeRole)}
                  </span>
                </div>
              )}
              {assigneeId && !selectedAssigneeRole && (
                <p className="text-[11px] text-[var(--color-text-muted)] mt-2">
                  Role badge unavailable (assignee may be a space admin not listed on this project).
                </p>
              )}
            </div>

            <div>
              <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Priority</label>
              <select
                disabled={!canWrite}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="app-control cursor-pointer px-3 py-2.5"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Due date</label>
              <input
                disabled={!canWrite}
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="app-control px-3 py-2.5"
              />
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                Stored as a date; rendered in your local timezone.
              </p>
            </div>

            <div className="pt-3 flex items-center justify-between gap-3">
              {canManage ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-[var(--radius-md)] border border-red-500/35 bg-red-500/12 px-3 py-2 text-sm font-medium text-red-700 transition duration-200 ease-out hover:bg-red-500/18 active:scale-[0.98] dark:text-red-200"
                >
                  Delete
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button type="button" onClick={onClose} className="app-btn-modal-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canWrite || submitting || !title.trim()}
                  className="app-btn-modal-primary"
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

