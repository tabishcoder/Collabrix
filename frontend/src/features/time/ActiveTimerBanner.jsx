import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { stopTimer } from "./timeTrackingSlice";

function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m < 60) return rem ? `${m}m ${rem}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm ? `${h}h ${rm}m` : `${h}h`;
}

export default function ActiveTimerBanner() {
  const dispatch = useDispatch();
  const activeEntry = useSelector((s) => s.timeTracking.activeEntry);
  const [tick, setTick] = useState(0);

  const running = Boolean(activeEntry && activeEntry.endedAt == null);

  useEffect(() => {
    if (!running) return undefined;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const elapsedSeconds = useMemo(() => {
    if (!activeEntry || activeEntry.endedAt != null) return 0;
    const start = new Date(activeEntry.startedAt).getTime();
    if (Number.isNaN(start)) return activeEntry.runningSeconds ?? 0;
    return Math.max(0, Math.floor((Date.now() - start) / 1000));
  }, [activeEntry, tick]);

  if (!running) return null;

  const task = activeEntry.taskId;
  const taskTitle =
    task && typeof task === "object" ? task.title || "Task" : "Task";
  const rawProjectId =
    task && typeof task === "object" && task.projectId != null
      ? task.projectId._id ?? task.projectId
      : null;
  const projectId = rawProjectId != null ? String(rawProjectId) : null;

  const handleStop = async () => {
    try {
      await dispatch(stopTimer()).unwrap();
      toast.success("Timer stopped");
    } catch (err) {
      toast.error(err || "Could not stop timer");
    }
  };

  return (
    <div
      role="status"
      className="flex shrink-0 items-center justify-center gap-3 border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-primary)_12%,var(--color-card))] px-4 py-2 text-[13px] text-[var(--color-text-primary)] sm:justify-between sm:px-6"
    >
      <div className="flex min-w-0 flex-col items-center gap-0.5 sm:flex-row sm:items-center sm:gap-3">
        <span className="font-semibold tabular-nums text-[var(--color-primary)]">
          {formatDuration(elapsedSeconds)}
        </span>
        <span className="truncate text-[var(--color-text-secondary)]">
          on{" "}
          {projectId ? (
            <Link
              to={`/projects/${projectId}`}
              className="font-medium text-[var(--color-text-primary)] underline decoration-[var(--color-border-strong)] underline-offset-2 hover:decoration-[var(--color-primary)]"
            >
              {taskTitle}
            </Link>
          ) : (
            <span className="font-medium text-[var(--color-text-primary)]">{taskTitle}</span>
          )}
        </span>
      </div>
      <button
        type="button"
        onClick={handleStop}
        className="shrink-0 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-card)] px-3 py-1 text-[12px] font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-muted)]"
      >
        Stop
      </button>
    </div>
  );
}
