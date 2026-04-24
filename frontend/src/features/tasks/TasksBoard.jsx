import { DndContext, closestCorners } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useEffect, useState } from "react";
import { useDispatch, useSelector }  from "react-redux";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { getProjectTasks, editTask, optimisticStatusUpdate } from "./tasksSlice";
import { fetchProjectById }   from "../projects/projectSlice";
import { updateBoardColumnsApi } from "../projects/projectApi";
import { canManageProject, canWriteTasks } from "../../utils/roles";
import Column       from "./Column";
import TaskListRow  from "./TaskListRow";
import AddTaskModal from "./AddTaskModal";
import BoardColumnsEditor from "./BoardColumnsEditor";

const DEFAULT_COLUMNS = [
  { key: "todo",        name: "To Do",      order: 0 },
  { key: "in_progress", name: "In Progress", order: 1 },
  { key: "done",        name: "Done",        order: 2 },
];

export default function TasksBoard() {
  const { projectId }  = useParams();
  const dispatch       = useDispatch();

  const { tasks, isLoading, isError, message } = useSelector((s) => s.tasks);
  const { activeProject } = useSelector((s) => s.projects);

  const [viewMode,        setViewMode]        = useState("kanban"); // 'kanban' | 'list'
  const [showModal,       setShowModal]       = useState(false);
  const [showColEditor,   setShowColEditor]   = useState(false);
  const [savingCols,      setSavingCols]      = useState(false);

  // Resolve columns: prefer activeProject boardColumns, fallback to defaults
  const columns = (activeProject?._id === projectId && activeProject?.boardColumns?.length > 0)
    ? [...activeProject.boardColumns].sort((a, b) => a.order - b.order)
    : DEFAULT_COLUMNS;

  const myProjectRole = activeProject?.myRole ?? null;
  const canManage     = canManageProject(myProjectRole);
  const canWrite      = canWriteTasks(myProjectRole);

  // Fetch tasks when project changes
  useEffect(() => {
    if (projectId) dispatch(getProjectTasks(projectId));
  }, [dispatch, projectId]);

  // Fetch project if activeProject doesn't match
  useEffect(() => {
    if (projectId && activeProject?._id !== projectId) {
      dispatch(fetchProjectById(projectId));
    }
  }, [dispatch, projectId, activeProject?._id]);

  // ── Drag end ──────────────────────────────────────────────────────────────
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find((t) => t._id === active.id);
    if (!activeTask) return;

    const colKeys = columns.map((c) => c.key);
    let newStatus;

    if (colKeys.includes(over.id)) {
      newStatus = over.id;
    } else {
      const overTask = tasks.find((t) => t._id === over.id);
      if (!overTask) return;
      newStatus = overTask.status;
    }

    if (!newStatus || newStatus === activeTask.status) return;

    const previousStatus = activeTask.status;
    dispatch(optimisticStatusUpdate({ taskId: active.id, status: newStatus }));

    try {
      await dispatch(editTask({ taskId: active.id, updates: { status: newStatus } })).unwrap();
    } catch {
      dispatch(optimisticStatusUpdate({ taskId: active.id, status: previousStatus }));
      toast.error("Failed to move task");
    }
  };

  // ── Save board columns ────────────────────────────────────────────────────
  const handleSaveColumns = async (newColumns) => {
    setSavingCols(true);
    try {
      await updateBoardColumnsApi(projectId, newColumns);
      await dispatch(fetchProjectById(projectId)).unwrap();
      toast.success("Board columns updated");
      setShowColEditor(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update columns");
    } finally {
      setSavingCols(false);
    }
  };

  // ── Loading / error states ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-6 flex items-center gap-3 text-white/40">
        <div className="w-4 h-4 border-2 border-white/20 border-t-indigo-400 rounded-full animate-spin" />
        Loading tasks...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <p className="text-red-400 text-sm">{message || "Failed to load tasks."}</p>
      </div>
    );
  }

  const getTasksByKey = (key) => tasks.filter((t) => t.status === key);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 min-h-screen bg-[var(--color-bg)]">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">
            {activeProject?.name || "Project Board"}
          </h2>
          <p className="text-white/40 text-xs mt-0.5">{tasks.length} tasks total</p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            {["kanban", "list"].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-xs font-medium capitalize transition
                  ${viewMode === mode
                    ? "bg-indigo-600 text-white"
                    : "bg-white/5 text-white/50 hover:bg-white/10"
                  }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Column editor (managers) */}
          {canManage && (
            <button
              onClick={() => setShowColEditor(true)}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white text-xs font-medium transition"
            >
              Edit Columns
            </button>
          )}

          {/* Add task (contributors+) */}
          {canWrite && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition"
            >
              + Add Task
            </button>
          )}
        </div>
      </div>

      {/* ── Kanban ──────────────────────────────────────────────────────── */}
      {viewMode === "kanban" && (
        <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="flex gap-5 items-start overflow-x-auto pb-4">
            {columns.map((col) => (
              <SortableContext
                key={col.key}
                items={getTasksByKey(col.key).map((t) => t._id)}
                strategy={verticalListSortingStrategy}
              >
                <Column
                  column={col}
                  tasks={getTasksByKey(col.key)}
                  canWrite={canWrite}
                />
              </SortableContext>
            ))}
          </div>
        </DndContext>
      )}

      {/* ── List view ──────────────────────────────────────────────────── */}
      {viewMode === "list" && (
        <div className="space-y-6">
          {columns.map((col) => {
            const colTasks = getTasksByKey(col.key);
            return (
              <div key={col.key}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm font-semibold text-white/80">{col.name}</span>
                  <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                    {colTasks.length}
                  </span>
                </div>

                {colTasks.length === 0 ? (
                  <p className="text-white/25 text-xs pl-2">No tasks</p>
                ) : (
                  <div className="space-y-2">
                    {colTasks.map((task) => (
                      <TaskListRow
                        key={task._id}
                        task={task}
                        columns={columns}
                        canWrite={canWrite}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <AddTaskModal
          projectId={projectId}
          columns={columns}
          onClose={() => setShowModal(false)}
        />
      )}

      {showColEditor && (
        <BoardColumnsEditor
          columns={columns}
          saving={savingCols}
          onSave={handleSaveColumns}
          onClose={() => setShowColEditor(false)}
        />
      )}
    </div>
  );
}
