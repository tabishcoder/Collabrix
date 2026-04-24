import { useDispatch } from "react-redux";
import { editTask, optimisticStatusUpdate } from "./tasksSlice";
import toast from "react-hot-toast";

export default function TaskListRow({ task, columns, canWrite }) {
  const dispatch = useDispatch();

  const handleStatusChange = async (newStatus) => {
    const prev = task.status;
    dispatch(optimisticStatusUpdate({ taskId: task._id, status: newStatus }));
    try {
      await dispatch(editTask({ taskId: task._id, updates: { status: newStatus } })).unwrap();
    } catch {
      dispatch(optimisticStatusUpdate({ taskId: task._id, status: prev }));
      toast.error("Failed to update task");
    }
  };

  const colName = columns.find((c) => c.key === task.status)?.name ?? task.status;

  return (
    <div className="flex items-center gap-4 bg-[var(--color-card)] border border-white/5 rounded-lg px-4 py-3 hover:border-white/10 transition group">

      {/* Status badge / selector */}
      {canWrite ? (
        <select
          value={task.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="text-xs rounded-md bg-white/5 border border-white/10 text-white/70 px-2 py-1 focus:outline-none focus:border-indigo-500/50 cursor-pointer"
        >
          {columns.map((col) => (
            <option key={col.key} value={col.key}>
              {col.name}
            </option>
          ))}
        </select>
      ) : (
        <span className="text-xs bg-white/8 text-white/50 px-2 py-1 rounded-md">{colName}</span>
      )}

      {/* Title */}
      <span className="flex-1 text-sm text-white/80 font-medium truncate">{task.title}</span>

      {/* Assignee */}
      {task.assignee && (
        <div
          className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shrink-0"
          title={task.assignee.name}
        >
          {task.assignee.name?.[0] ?? "?"}
        </div>
      )}
    </div>
  );
}
