import { DndContext, closestCorners } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useEffect, useMemo, useState } from "react";
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
import TaskDetailModal from "./TaskDetailModal";
import TaskFilters, { defaultTaskFilters, applyTaskFilters } from "./TaskFilters";
import { TasksBoardSkeleton } from "../../components/ui/Skeleton";

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
  const [activeTaskId,    setActiveTaskId]    = useState(null);
  const [taskFilters, setTaskFilters] = useState(() => defaultTaskFilters());

  // Resolve columns: prefer activeProject boardColumns, fallback to defaults
  const columns = (activeProject?._id === projectId && activeProject?.boardColumns?.length > 0)
    ? [...activeProject.boardColumns].sort((a, b) => a.order - b.order)
    : DEFAULT_COLUMNS;

  const myProjectRole = activeProject?.myRole ?? null;
  const canManage     = canManageProject(myProjectRole);
  const canWrite      = canWriteTasks(myProjectRole);
  const isViewer      = myProjectRole === "viewer";

  const activeTask = activeTaskId ? tasks.find((t) => t._id === activeTaskId) : null;
  const projectMembers = activeProject?.members ?? [];

  const filteredTasks = useMemo(
    () => applyTaskFilters(tasks, taskFilters, columns),
    [tasks, taskFilters, columns],
  );

  // Fetch tasks when project changes
  useEffect(() => {
    if (projectId) dispatch(getProjectTasks(projectId));
  }, [dispatch, projectId]);

  useEffect(() => {
    setTaskFilters(defaultTaskFilters());
  }, [projectId]);

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
      const overTask = filteredTasks.find((t) => t._id === over.id) || tasks.find((t) => t._id === over.id);
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
      <div className="pb-2">
        <TasksBoardSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="rounded-[var(--radius-lg)] border border-red-500/25 bg-red-500/[0.06] px-5 py-4 dark:bg-red-500/10"
        role="alert"
      >
        <p className="text-sm font-medium text-red-700 dark:text-red-300">
          {message || "Failed to load tasks."}
        </p>
      </div>
    );
  }

  const getTasksByKey = (key) => filteredTasks.filter((t) => t.status === key);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-0 space-y-5">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold leading-tight tracking-tight text-[var(--color-text-primary)] sm:text-xl">
              {activeProject?.name || "Project Board"}
            </h2>
            {isViewer && (
              <span className="rounded border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                Read only
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] tabular-nums text-[var(--color-text-muted)]">
            {filteredTasks.length === tasks.length
              ? `${tasks.length} tasks`
              : `${filteredTasks.length} of ${tasks.length} tasks`}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          <TaskFilters
            filters={taskFilters}
            onChange={setTaskFilters}
            projectMembers={projectMembers}
            projectId={projectId}
          />

          {/* View toggle */}
          <div className="flex overflow-hidden rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface-muted)] p-0.5">
            {["kanban", "list"].map((mode) => (
              <button
                type="button"
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`rounded-[calc(var(--radius-sm)+1px)] px-2.5 py-1 text-[11px] font-medium capitalize transition-colors duration-150
                  ${viewMode === mode
                    ? "bg-[var(--color-card)] text-[var(--color-text-primary)] shadow-sm ring-1 ring-[var(--color-border)]"
                    : "bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Column editor (managers) */}
          {canManage && (
            <button
              type="button"
              onClick={() => setShowColEditor(true)}
              className="rounded-md border border-[var(--color-border-strong)] bg-[var(--color-card)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--color-text-secondary)] transition-colors duration-150 hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
            >
              Edit Columns
            </button>
          )}

          {/* Add task (contributors+) */}
          {canWrite && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="rounded-md bg-[var(--color-primary)] px-3 py-1.5 text-[13px] font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-[var(--color-primary-hover)]"
            >
              + Add Task
            </button>
          )}
        </div>
      </div>

      {/* ── Kanban ──────────────────────────────────────────────────────── */}
      {viewMode === "kanban" && (
        <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="-mx-1 flex items-start gap-3 overflow-x-auto scroll-smooth px-1 pb-2 sm:gap-4">
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
                  canManage={canManage}
                  onOpenTask={(taskId) => setActiveTaskId(taskId)}
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
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">{col.name}</span>
                  <span className="rounded-full bg-[var(--color-surface-muted)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]">
                    {colTasks.length}
                  </span>
                </div>

                {colTasks.length === 0 ? (
                  <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-muted)]/60 py-8 pl-3 pr-4 text-left">
                    <p className="text-xs font-medium text-[var(--color-text-secondary)]">No tasks in {col.name}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-[var(--color-text-muted)]">
                      {canWrite ? "Add a task or switch to Kanban to drag items here." : "Nothing to show in this section."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {colTasks.map((task) => (
                      <TaskListRow
                        key={task._id}
                        task={task}
                        columns={columns}
                        canWrite={canWrite}
                        onOpen={() => setActiveTaskId(task._id)}
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

      {activeTask && (
        <TaskDetailModal
          task={activeTask}
          columns={columns}
          projectMembers={projectMembers}
          canWrite={canWrite}
          canManage={canManage}
          onClose={() => setActiveTaskId(null)}
        />
      )}
    </div>
  );
}
