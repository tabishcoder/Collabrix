import { useState } from "react";
import { DndContext, closestCorners } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import KanbanColumn from "./KanbanColumn";

const initialColumns = [
  {
    id: "todo",
    title: "Todo",
    tasks: [
      { id: "t1", title: "Design UI" },
      { id: "t2", title: "Setup project" },
    ],
  },
  {
    id: "inprogress",
    title: "In Progress",
    tasks: [{ id: "t3", title: "Build sidebar" }],
  },
  {
    id: "done",
    title: "Done",
    tasks: [],
  },
];

export default function KanbanBoard() {
  const [columns, setColumns] = useState(initialColumns);

  const findColumnByTaskId = (taskId) =>
    columns.find((col) => col.tasks.some((task) => task.id === taskId));

  const handleDragEnd = ({ active, over }) => {
    if (!over) return;

    const sourceCol = findColumnByTaskId(active.id);
    const targetCol =
      findColumnByTaskId(over.id) || columns.find((col) => col.id === over.id);

    if (!sourceCol || !targetCol) return;

    if (sourceCol.id === targetCol.id) {
      const oldIndex = sourceCol.tasks.findIndex((t) => t.id === active.id);
      const newIndex = targetCol.tasks.findIndex((t) => t.id === over.id);

      const updatedTasks = arrayMove(sourceCol.tasks, oldIndex, newIndex);

      setColumns((cols) =>
        cols.map((col) =>
          col.id === sourceCol.id ? { ...col, tasks: updatedTasks } : col,
        ),
      );
    } else {
      const task = sourceCol.tasks.find((t) => t.id === active.id);

      setColumns((cols) =>
        cols.map((col) => {
          if (col.id === sourceCol.id) {
            return {
              ...col,
              tasks: col.tasks.filter((t) => t.id !== active.id),
            };
          }
          if (col.id === targetCol.id) {
            return {
              ...col,
              tasks: [...col.tasks, task],
            };
          }
          return col;
        }),
      );
    }
  };

  return (
    <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto p-4">
        {columns.map((col) => (
          <KanbanColumn key={col.id} column={col} />
        ))}
      </div>
    </DndContext>
  );
}
