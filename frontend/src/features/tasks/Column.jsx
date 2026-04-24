import { useDroppable } from "@dnd-kit/core";
import TaskCard from "./TaskCard";

export default function Column({ column, tasks = [], canWrite, canManage, onOpenTask }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.key, // stable key used as task.status value
  });

  return (
    <div
      ref={setNodeRef}
      className={`w-72 shrink-0 p-4 rounded-xl border transition
        ${isOver
          ? "bg-indigo-600/10 border-indigo-500/40"
          : "bg-[var(--color-card)] border-white/5"
        }`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-white/80">{column.name}</span>
        <span className="text-xs text-white/30 bg-white/5 rounded-full px-2 py-0.5">
          {tasks.length}
        </span>
      </div>

      {/* Task list */}
      <div className="space-y-3 min-h-[80px]">
        {tasks.length === 0 ? (
          <p className="text-white/25 text-xs text-center py-6">
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
