// src/features/tasks/TaskCard.jsx
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDispatch } from "react-redux";
import { removeTask } from "./tasksSlice";

export default function TaskCard({ task }) {
  const dispatch = useDispatch();

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-[var(--color-bg)] p-4 rounded-lg shadow-md border border-white/5 cursor-grab hover:border-[var(--color-primary)] transition"
      data-task-id={task._id}
    >
      <h4 className="font-medium text-[var(--color-text-primary)]">
        {task.title}
      </h4>

      {task.description && (
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between mt-3">
        <div className="text-xs text-[var(--color-text-secondary)]">
          {task.assignee?.name
            ? `Assignee: ${task.assignee.name}`
            : "Unassigned"}
        </div>

        <button
          onClick={() => {
            // confirm before delete (optional)
            if (window.confirm("Delete this task?")) {
              dispatch(removeTask(task._id));
            }
          }}
          className="text-xs text-[var(--color-highlight)] hover:underline"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
