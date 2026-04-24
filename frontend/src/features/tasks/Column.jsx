import { useDroppable } from "@dnd-kit/core";
import TaskCard from "./TaskCard";

export default function Column({ column, tasks = [], canWrite, canManage, onOpenTask }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.key, // stable key used as task.status value
  });

  return (
    <div
      ref={setNodeRef}
      className={`w-[min(18rem,calc(100vw-2rem))] sm:w-72 shrink-0 p-3.5 sm:p-4 rounded-[var(--radius-lg)] border transition duration-200
        ${isOver
          ? "bg-indigo-600/12 border-indigo-500/45 shadow-[0_0_0_1px_rgba(99,102,241,0.35)]"
          : "bg-[var(--color-card)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]"
        }`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-3.5">
        <span className="text-sm font-semibold text-[var(--color-text-primary)]">{column.name}</span>
        <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-2 py-0.5 text-[11px] tabular-nums text-[var(--color-text-muted)]">
          {tasks.length}
        </span>
      </div>

      {/* Task list */}
      <div className="space-y-2.5 min-h-[72px]">
        {tasks.length === 0 ? (
          <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] py-6 text-center text-xs text-[var(--color-text-muted)]">
            {canWrite ? "Drop tasks here" : "Empty"}
          </p>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              canDrag={canWrite}
              canManage={canManage}
              onOpen={() => onOpenTask?.(task._id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
