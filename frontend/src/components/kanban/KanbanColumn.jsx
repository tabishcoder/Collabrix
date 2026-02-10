import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import KanbanTask from "./KanbanTask";

export default function KanbanColumn({ column }) {
  return (
    <div className="w-72 bg-[var(--color-card)] border border-white/10 rounded-lg p-3">
      <h3 className="font-semibold text-sm mb-3 text-[var(--color-text-primary)]">
        {column.title}
      </h3>

      <SortableContext
        items={column.tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2 min-h-[40px]">
          {column.tasks.map((task) => (
            <KanbanTask key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>

      <button className="mt-3 text-xs text-[var(--color-primary)] hover:underline">
        + Add task
      </button>
    </div>
  );
}
