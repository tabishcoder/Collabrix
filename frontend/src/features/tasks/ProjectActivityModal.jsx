import { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";
import { getProjectHistoryApi } from "../history/historyApi";

const actionLabel = (action) => {
  const map = {
    created: "Created",
    updated: "Updated",
    moved: "Moved",
    deleted: "Deleted",
    assigned: "Assigned",
    commented: "Commented",
    columns_updated: "Columns updated",
    role_changed: "Role changed",
    added: "Added",
    removed: "Removed",
    invite_sent: "Invite sent",
    invite_accepted: "Invite accepted",
  };
  return map[action] || action;
};

export default function ProjectActivityModal({ projectId, onClose }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!projectId) return;
      setLoading(true);
      try {
        const res = await getProjectHistoryApi(projectId);
        if (!cancelled) setRows(res.data || []);
      } catch (err) {
        if (!cancelled) toast.error(err?.response?.data?.message || "Failed to load activity");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center px-4 py-8 app-modal-backdrop">
      <div className="app-modal-panel flex max-h-[min(88dvh,720px)] w-full max-w-lg flex-col overflow-hidden">
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Project activity</h3>
          <button type="button" onClick={onClose} className="app-modal-close !p-1" aria-label="Close">
            <FaTimes className="text-sm" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {loading && <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>}
          {!loading && rows.length === 0 && (
            <p className="text-sm text-[var(--color-text-muted)]">No activity recorded yet.</p>
          )}
          <ul className="space-y-3">
            {!loading &&
              rows.map((h) => (
                <li
                  key={h._id}
                  className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-[12px]"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {h.performedBy?.name || "Someone"}{" "}
                      <span className="font-normal text-[var(--color-text-secondary)]">
                        · {actionLabel(h.action)} {h.entityType}
                      </span>
                    </span>
                    <time className="text-[10px] text-[var(--color-text-muted)]">
                      {h.timestamp ? new Date(h.timestamp).toLocaleString() : ""}
                    </time>
                  </div>
                  {h.details && Object.keys(h.details).length > 0 && (
                    <pre className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap break-words text-[11px] text-[var(--color-text-muted)]">
                      {JSON.stringify(h.details, null, 0).slice(0, 280)}
                      {JSON.stringify(h.details).length > 280 ? "…" : ""}
                    </pre>
                  )}
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
