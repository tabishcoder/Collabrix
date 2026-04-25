import { useDroppable } from "@dnd-kit/core";
import { FaInbox } from "react-icons/fa";
import TaskCard from "./TaskCard";

export default function Column({ column, tasks = [], canWrite, canManage, onOpenTask }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.key, // stable key used as task.status value
  });

  return (
    <div
      ref={setNodeRef}
      className={`w-[min(17rem,calc(100vw-2rem))] shrink-0 rounded-lg border p-3 shadow-sm transition-colors duration-150 sm:w-[17.5rem] sm:p-3
        ${isOver
          ? "border-[color-mix(in_oklab,var(--color-primary)_40%,var(--color-border-strong))] bg-[color-mix(in_oklab,var(--color-primary)_6%,var(--color-card))]"
          : "border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-border-strong)]"
        }`}
    >
      {/* Column header */}
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="truncate text-[13px] font-semibold tracking-tight text-[var(--color-text-primary)]">{column.name}</span>
        <span className="shrink-0 rounded border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-[var(--color-text-muted)]">
          {tasks.length}
        </span>
      </div>

      {/* Task list */}
      <div className="min-h-[56px] space-y-2">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-muted)]/50 px-2 py-6 text-center">
            <FaInbox className="mb-1.5 h-5 w-5 text-[var(--color-text-muted)] opacity-60" aria-hidden />
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">
              {canWrite ? "No tasks yet" : "Empty column"}
            </p>
            <p className="mt-1 max-w-[12rem] text-[11px] leading-relaxed text-[var(--color-text-muted)]">
              {canWrite ? "Drop a card here or create a task." : "Tasks will appear here."}
            </p>
          </div>
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
