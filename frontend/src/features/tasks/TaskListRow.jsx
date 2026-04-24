import { useDispatch } from "react-redux";
import { editTask, optimisticStatusUpdate } from "./tasksSlice";
import toast from "react-hot-toast";

export default function TaskListRow({ task, columns, canWrite, onOpen }) {
  const dispatch = useDispatch();

  const handleStatusChange = async (newStatus) => {
    const prev = task.status;
    dispatch(optimisticStatusUpdate({ taskId: task._id, status: newStatus }));
    try {
      await dispatch(editTask({ taskId: task._id, updates: { status: newStatus } })).unwrap();
    } catch {
      dispatch(optimisticStatusUpdate({ taskId: task._id, status: prev }));
      toast.error("Failed to update task");
    }
  };

  const colName = columns.find((c) => c.key === task.status)?.name ?? task.status;

  return (
    <div
      className="group flex cursor-pointer items-center gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 transition hover:border-[var(--color-border-strong)]"
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen?.();
      }}
    >

      {canWrite ? (
        <select
          value={task.status}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="cursor-pointer rounded-md border border-[var(--color-border-strong)] bg-[var(--color-input-bg)] px-2 py-1 text-xs text-[var(--color-text-primary)] focus:border-indigo-500/50 focus:outline-none"
        >
          {columns.map((col) => (
            <option key={col.key} value={col.key}>
              {col.name}
            </option>
          ))}
        </select>
      ) : (
        <span className="rounded-md bg-[var(--color-surface-muted)] px-2 py-1 text-xs text-[var(--color-text-muted)]">{colName}</span>
      )}

      <span className="flex-1 truncate text-sm font-medium text-[var(--color-text-primary)]">{task.title}</span>

      {task.assignee && (
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-xs font-bold text-white"
          title={task.assignee.name}
        >
          {task.assignee.name?.[0] ?? "?"}
        </div>
      )}
    </div>
  );
}
