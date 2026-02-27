// src/features/tasks/Column.jsx
import { useDroppable } from "@dnd-kit/core";
import TaskCard from "./TaskCard";

export default function Column({ column, tasks = [] }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id, // important: column id = todo | in_progress | done
  });

  return (
    <div
      ref={setNodeRef}
      className={`w-80 p-4 rounded-xl border transition
        ${
          isOver
            ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)]"
            : "bg-[var(--color-card)] border-white/5"
        }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">{column.title}</h3>
        <span className="text-xs text-[var(--color-text-secondary)]">
          {tasks.length}
        </span>
      </div>

      <div className="space-y-3 min-h-[100px]">
        {tasks.length === 0 ? (
          <div className="text-[var(--color-text-secondary)] text-sm">
            Drop task here
          </div>
        ) : (
          tasks.map((task) => <TaskCard key={task._id} task={task} />)
        )}
      </div>
    </div>
  );
}
