// src/features/tasks/TaskCard.jsx
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDispatch } from "react-redux";
import { removeTask } from "./tasksSlice";

const priorityDotClass = (priority) => {
  switch (priority) {
    case "low":
      return "bg-green-400";
    case "medium":
      return "bg-yellow-400";
    case "high":
      return "bg-orange-400";
    case "urgent":
      return "bg-red-400";
    default:
      return "bg-slate-300 dark:bg-white/30";
  }
};

function isOverdue(dueDate) {
  if (!dueDate) return false;
  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < today;
}

function formatDueChip(dueDate) {
  if (!dueDate) return "";
  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
}

export default function TaskCard({ task, onOpen, canDrag = true, canManage = false }) {
  const dispatch = useDispatch();

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: task._id, disabled: !canDrag });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group cursor-pointer rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-2.5 shadow-sm transition-colors duration-150 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklab,var(--color-primary)_35%,transparent)] sm:p-3"
      data-task-id={task._id}
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen?.();
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${priorityDotClass(task.priority)}`}
              title={`Priority: ${task.priority ?? "none"}`}
            />
            <h4 className="truncate text-[13px] font-medium leading-snug tracking-tight text-[var(--color-text-primary)] sm:text-sm">
              {task.title}
            </h4>
          </div>

          {task.description && (
            <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
              {task.description}
            </p>
          )}
        </div>

        {/* Drag handle (writers only) */}
        {canDrag && (
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 cursor-grab rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-surface-muted)] px-2 py-1 text-[var(--color-text-muted)] transition duration-200 hover:border-indigo-500/30 hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] focus-visible:ring-2 focus-visible:ring-indigo-500/25 active:cursor-grabbing"
            title="Drag task"
            {...attributes}
            {...listeners}
          >
            ⋮⋮
          </button>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-[var(--color-text-secondary)]">
          {/* Due date chip */}
          {task.dueDate && (
            <span
              className={`px-2 py-0.5 rounded-full border text-[11px] ${
                isOverdue(task.dueDate)
                  ? "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-200"
                  : "border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"
              }`}
              title="Due date"
            >
              {formatDueChip(task.dueDate)}
            </span>
          )}

          {/* Assignee */}
          <span className="truncate">
            {task.assignee?.name ? task.assignee.name : "Unassigned"}
          </span>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm("Delete this task?")) {
                dispatch(removeTask(task._id));
              }
            }}
            className="text-xs text-[var(--color-highlight)] hover:underline"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
