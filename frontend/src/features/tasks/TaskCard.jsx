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
      return "bg-white/30";
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
      className="bg-[var(--color-bg)] p-4 rounded-lg shadow-md border border-white/5 hover:border-[var(--color-primary)] transition"
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
            <h4 className="font-medium text-[var(--color-text-primary)] truncate">
              {task.title}
            </h4>
          </div>

          {task.description && (
            <p className="text-sm text-[var(--color-text-secondary)] mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>

        {/* Drag handle */}
        <button
          type="button"
          disabled={!canDrag}
          onClick={(e) => e.stopPropagation()}
          className={`shrink-0 px-2 py-1 rounded-md border border-white/10 bg-white/5 text-white/40 hover:text-white/70 ${
            canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-not-allowed opacity-50"
          }`}
          title={canDrag ? "Drag task" : "Read-only"}
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </button>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] min-w-0">
          {/* Due date chip */}
          {task.dueDate && (
            <span
              className={`px-2 py-0.5 rounded-full border text-[11px] ${
                isOverdue(task.dueDate)
                  ? "bg-red-500/10 border-red-500/30 text-red-200"
                  : "bg-white/5 border-white/10 text-white/50"
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
