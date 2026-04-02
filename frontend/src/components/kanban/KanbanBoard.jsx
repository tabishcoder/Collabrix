import { useState } from "react";
import KanbanColumn from "./KanbanColumn";
import { DndContext } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

export default function KanbanBoard() {
  const initialData = {
    columns: {
      todo: { id: "todo", title: "Todo", taskId: ["t1", "t2", "t3"] },
      doing: { id: "doing", title: "Doing", taskId: ["t4"] },
      done: { id: "done", title: "Done", taskId: ["t5"] },
    },
    tasks: {
      t1: { id: "t1", title: "Setup Project Boards" },
      t2: { id: "t2", title: "Setup Board's Columns" },
      t3: { id: "t3", title: "Write Code for Boards, Columns and Tasks" },
      t4: { id: "t4", title: "Let's work on FYP, you are doing right" },
      t5: { id: "t5", title: "Go on Tabish" },
    },
    columnOrder: ["todo", "doing", "done"],
  };

  const [board, setBoard] = useState(initialData);

  function handleDragEnd(event) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setBoard((prev) => moveTask(prev, active.id, over.id));
  }

  function moveTask(board, activeId, overId) {
    const newBoard = structuredClone(board);

    let sourceColumnId = null;

    // Find which column contains the dragged task
    for (const columnId of newBoard.columnOrder) {
      if (newBoard.columns[columnId].taskId.includes(activeId)) {
        sourceColumnId = columnId;
        break;
      }
    }

    if (!sourceColumnId) return board;

    const column = newBoard.columns[sourceColumnId];

    const oldIndex = column.taskId.indexOf(activeId);
    const newIndex = column.taskId.indexOf(overId);

    if (oldIndex === -1 || newIndex === -1) return board;

    column.taskId = arrayMove(column.taskId, oldIndex, newIndex);

    return newBoard;
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div style={{ display: "flex", gap: "20px" }}>
        {board.columnOrder.map((columnId) => {
          const column = board.columns[columnId];
          const tasks = column.taskId.map((id) => board.tasks[id]);

          return <KanbanColumn key={column.id} column={column} tasks={tasks} />;
        })}
      </div>
    </DndContext>
  );
}
