// src/features/tasks/TasksBoard.jsx
import { DndContext, closestCorners } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { getProjectTasks, editTask } from "./tasksSlice";
import Column from "./Column";
import AddTaskModal from "./AddTaskModal";

const columns = [
  { id: "todo", title: "Todo" },
  { id: "in_progress", title: "In Progress" },
  { id: "done", title: "Done" },
];

export default function TasksBoard() {
  const { projectId } = useParams();
  const dispatch = useDispatch();
  const { tasks, isLoading } = useSelector((s) => s.tasks);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (projectId) dispatch(getProjectTasks(projectId));
  }, [dispatch, projectId]);

  const getTasksByStatus = (status) => tasks.filter((t) => t.status === status);

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over) return;

    const activeTask = tasks.find((t) => t._id === active.id);
    if (!activeTask) return;

    let newStatus;

    // Case 1: dropped directly on a column
    if (["todo", "in_progress", "done"].includes(over.id)) {
      newStatus = over.id;
    }
    // Case 2: dropped on another task → take that task's status
    else {
      const overTask = tasks.find((t) => t._id === over.id);
      if (!overTask) return;
      newStatus = overTask.status;
    }

    if (!newStatus || newStatus === activeTask.status) return;

    // Optimistic update
    const previousStatus = activeTask.status;

    dispatch({
      type: "tasks/optimisticStatusUpdate",
      payload: { taskId: active.id, status: newStatus },
    });

    try {
      await dispatch(
        editTask({
          taskId: active.id,
          updates: { status: newStatus },
        }),
      ).unwrap();
    } catch (error) {
      // Rollback on failure
      dispatch({
        type: "tasks/optimisticStatusUpdate",
        payload: { taskId: active.id, status: previousStatus },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 text-[var(--color-text-secondary)]">
        Loading tasks...
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-[var(--color-bg)]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Project Board</h2>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-md bg-[var(--color-primary)] text-white hover:opacity-90 transition"
        >
          + Add Task
        </button>
      </div>

      <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex gap-6 items-start">
          {columns.map((col) => (
            <SortableContext
              key={col.id}
              items={getTasksByStatus(col.id).map((t) => t._id)}
              strategy={verticalListSortingStrategy}
            >
              <Column column={col} tasks={getTasksByStatus(col.id)} />
            </SortableContext>
          ))}
        </div>
      </DndContext>

      {showModal && (
        <AddTaskModal
          projectId={projectId}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
