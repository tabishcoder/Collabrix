import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  createManualTimeEntryApi,
  deleteTimeEntryApi,
  fetchTimeEntriesByTaskApi,
  updateTimeEntryApi,
} from "../time/timeEntriesApi";
import { fetchActiveTimer, startTimer, stopTimer } from "../time/timeTrackingSlice";

function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m < 60) return rem ? `${m}m ${rem}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm ? `${h}h ${rm}m` : `${h}h`;
}

function toDatetimeLocalValue(dateLike) {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function entryTaskId(entry) {
  const t = entry?.taskId;
  if (!t) return "";
  return String(typeof t === "object" ? t._id ?? t : t);
}

export default function TaskTimeSection({ task, canWrite, currentUserId }) {
  const dispatch = useDispatch();
  const activeEntry = useSelector((s) => s.timeTracking.activeEntry);
  const [entries, setEntries] = useState([]);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualStart, setManualStart] = useState("");
  const [manualEnd, setManualEnd] = useState("");
  const [manualNote, setManualNote] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editStarted, setEditStarted] = useState("");
  const [editEnded, setEditEnded] = useState("");
  const [editNote, setEditNote] = useState("");

  const taskIdStr = task?._id ? String(task._id) : "";

  const activeOnThisTask = useMemo(() => {
    if (!activeEntry || activeEntry.endedAt != null) return false;
    return entryTaskId(activeEntry) === taskIdStr;
  }, [activeEntry, taskIdStr]);

  const runningSecondsOnTask = useMemo(() => {
    if (!activeOnThisTask || !activeEntry?.startedAt) return 0;
    const start = new Date(activeEntry.startedAt).getTime();
    if (Number.isNaN(start)) return activeEntry.runningSeconds ?? 0;
    return Math.max(0, Math.floor((Date.now() - start) / 1000));
  }, [activeOnThisTask, activeEntry, tick]);

  useEffect(() => {
    const hasRunningRow = entries.some((e) => e.endedAt == null);
    const shouldTick = Boolean(activeOnThisTask || hasRunningRow);
    if (!shouldTick) return undefined;
    const id = window.setInterval(() => setTick((x) => x + 1), 1000);
    return () => window.clearInterval(id);
  }, [activeOnThisTask, entries]);

  const loadEntries = useCallback(async () => {
    if (!task?._id) return;
    setLoading(true);
    try {
      const res = await fetchTimeEntriesByTaskApi(task._id);
      setEntries(res.data.entries || []);
      setTotalSeconds(res.data.totalSeconds ?? 0);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load time entries");
    } finally {
      setLoading(false);
    }
  }, [task?._id]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const refreshTimerState = async () => {
    await dispatch(fetchActiveTimer());
  };

  const handleStart = async () => {
    if (!canWrite || !task?._id) return;
    setBusy(true);
    try {
      await dispatch(startTimer(task._id)).unwrap();
      toast.success("Timer started");
      await refreshTimerState();
      await loadEntries();
    } catch (err) {
      toast.error(err || "Could not start timer");
    } finally {
      setBusy(false);
    }
  };

  const handleStop = async () => {
    if (!canWrite || !task?._id) return;
    setBusy(true);
    try {
      await dispatch(stopTimer(task._id)).unwrap();
      toast.success("Timer stopped");
      await refreshTimerState();
      await loadEntries();
    } catch (err) {
      toast.error(err || "Could not stop timer");
    } finally {
      setBusy(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!canWrite || !task?._id) return;
    const start = new Date(manualStart);
    const end = new Date(manualEnd);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      toast.error("Enter valid start and end times");
      return;
    }
    if (start >= end) {
      toast.error("End must be after start");
      return;
    }
    setBusy(true);
    try {
      await createManualTimeEntryApi({
        taskId: task._id,
        startedAt: start.toISOString(),
        endedAt: end.toISOString(),
        note: manualNote.trim(),
      });
      toast.success("Time logged");
      setManualStart("");
      setManualEnd("");
      setManualNote("");
      setShowManual(false);
      await refreshTimerState();
      await loadEntries();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not add entry");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (entryId) => {
    if (!canWrite) return;
    if (!window.confirm("Remove this time entry?")) return;
    setBusy(true);
    try {
      await deleteTimeEntryApi(entryId);
      toast.success("Entry removed");
      await refreshTimerState();
      await loadEntries();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete");
    } finally {
      setBusy(false);
    }
  };

  const openEdit = (entry) => {
    setEditingId(entry._id);
    setEditStarted(toDatetimeLocalValue(entry.startedAt));
    setEditEnded(entry.endedAt == null ? "" : toDatetimeLocalValue(entry.endedAt));
    setEditNote(entry.note || "");
  };

  const handleSaveEdit = async (entry) => {
    if (!canWrite) return;
    const start = new Date(editStarted);
    if (Number.isNaN(start.getTime())) {
      toast.error("Invalid start time");
      return;
    }
    let endedPayload;
    if (editEnded.trim() === "") {
      endedPayload = null;
    } else {
      const end = new Date(editEnded);
      if (Number.isNaN(end.getTime())) {
        toast.error("Invalid end time");
        return;
      }
      endedPayload = end.toISOString();
      if (start >= end) {
        toast.error("End must be after start");
        return;
      }
    }

    setBusy(true);
    try {
      await updateTimeEntryApi(entry._id, {
        startedAt: start.toISOString(),
        endedAt: endedPayload,
        note: editNote.trim(),
      });
      toast.success("Entry updated");
      setEditingId(null);
      await refreshTimerState();
      await loadEntries();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update entry");
    } finally {
      setBusy(false);
    }
  };

  const liveDurationSeconds = (entry) => {
    if (entry.endedAt != null) return entry.durationSeconds ?? 0;
    const start = new Date(entry.startedAt).getTime();
    if (Number.isNaN(start)) return entry.runningSeconds ?? 0;
    return Math.max(0, Math.floor((Date.now() - start) / 1000));
  };

  const ownerId = (entry) =>
    entry.userId && typeof entry.userId === "object"
      ? String(entry.userId._id)
      : String(entry.userId ?? "");

  const summaryLine = () => {
    let extra = "";
    if (activeOnThisTask) {
      extra = ` · + ${formatDuration(runningSecondsOnTask)} running`;
    }
    return `${formatDuration(totalSeconds)} logged${extra}`;
  };

  return (
    <div className="border-t border-[var(--color-border)] pt-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          Time tracking
        </h4>
        {loading ? (
          <span className="text-[11px] text-[var(--color-text-muted)]">Loading…</span>
        ) : (
          <span className="text-[12px] font-medium tabular-nums text-[var(--color-text-secondary)]">
            {summaryLine()}
          </span>
        )}
      </div>

      {canWrite && (
        <div className="mb-4 flex flex-wrap gap-2">
          {!activeOnThisTask ? (
            <button
              type="button"
              disabled={busy}
              onClick={handleStart}
              className="rounded-md bg-[var(--color-primary)] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Working…" : "Start timer"}
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={handleStop}
              className="rounded-md border border-[var(--color-border-strong)] bg-[var(--color-card)] px-3 py-1.5 text-[12px] font-semibold text-[var(--color-text-primary)] disabled:opacity-50"
            >
              {busy ? "Working…" : "Stop timer"}
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => setShowManual((v) => !v)}
            className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-[12px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]"
          >
            {showManual ? "Hide manual entry" : "Add manual time"}
          </button>
        </div>
      )}

      {!canWrite && (
        <p className="mb-3 text-[11px] text-[var(--color-text-muted)]">
          You can view logged time; contributors and above can log time.
        </p>
      )}

      {showManual && canWrite && (
        <form
          onSubmit={handleManualSubmit}
          className="mb-4 space-y-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 p-3"
        >
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] text-[var(--color-text-muted)]">Start</label>
              <input
                type="datetime-local"
                required
                value={manualStart}
                onChange={(e) => setManualStart(e.target.value)}
                className="app-control w-full px-2 py-2 text-[13px]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-[var(--color-text-muted)]">End</label>
              <input
                type="datetime-local"
                required
                value={manualEnd}
                onChange={(e) => setManualEnd(e.target.value)}
                className="app-control w-full px-2 py-2 text-[13px]"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-[var(--color-text-muted)]">Note (optional)</label>
            <input
              type="text"
              value={manualNote}
              onChange={(e) => setManualNote(e.target.value)}
              maxLength={500}
              className="app-control w-full px-2 py-2 text-[13px]"
              placeholder="What did you work on?"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-[var(--color-primary)] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
          >
            Save manual entry
          </button>
        </form>
      )}

      <ul className="max-h-56 space-y-2 overflow-y-auto pr-1">
        {!loading && entries.length === 0 && (
          <li className="text-[12px] text-[var(--color-text-muted)]">No time logged yet.</li>
        )}
        {entries.map((entry) => {
          const mine = currentUserId && ownerId(entry) === String(currentUserId);
          const runningRow = entry.endedAt == null;
          const isEditing = editingId === entry._id;

          return (
            <li
              key={entry._id}
              className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)]/50 px-3 py-2"
            >
              {!isEditing ? (
                <>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-[12px] font-semibold text-[var(--color-text-primary)]">
                      {entry.userId?.name || "Member"}
                    </span>
                    <span className="text-[12px] tabular-nums text-[var(--color-text-secondary)]">
                      {formatDuration(liveDurationSeconds(entry))}
                      {runningRow && (
                        <span className="ml-1 text-[10px] font-normal text-[var(--color-primary)]">
                          running
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">
                    {entry.source === "manual" ? "Manual" : "Timer"}
                    {" · "}
                    {new Date(entry.startedAt).toLocaleString()}
                    {entry.endedAt != null && ` → ${new Date(entry.endedAt).toLocaleString()}`}
                  </div>
                  {entry.note ? (
                    <p className="mt-1 text-[12px] text-[var(--color-text-secondary)]">{entry.note}</p>
                  ) : null}
                  {mine && canWrite && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => openEdit(entry)}
                        className="text-[11px] font-medium text-[var(--color-primary)] hover:underline disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleDelete(entry._id)}
                        className="text-[11px] font-medium text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[10px] text-[var(--color-text-muted)]">Start</label>
                      <input
                        type="datetime-local"
                        value={editStarted}
                        onChange={(e) => setEditStarted(e.target.value)}
                        className="app-control w-full px-2 py-1.5 text-[12px]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] text-[var(--color-text-muted)]">
                        End (empty = running)
                      </label>
                      <input
                        type="datetime-local"
                        value={editEnded}
                        onChange={(e) => setEditEnded(e.target.value)}
                        className="app-control w-full px-2 py-1.5 text-[12px]"
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    maxLength={500}
                    className="app-control w-full px-2 py-1.5 text-[12px]"
                    placeholder="Note"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleSaveEdit(entry)}
                      className="rounded-md bg-[var(--color-primary)] px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setEditingId(null)}
                      className="rounded-md border border-[var(--color-border)] px-2 py-1 text-[11px] font-medium text-[var(--color-text-secondary)]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
