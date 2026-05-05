import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { createGroupChat, createPrivateChat } from "./chatSlice";

function collectEligibleMembers(activeProject, currentUserId) {
  const byId = new Map();
  const add = (u) => {
    if (!u?._id) return;
    if (String(u._id) === String(currentUserId)) return;
    const id = String(u._id);
    if (!byId.has(id)) byId.set(id, u);
  };
  (activeProject?.members || []).forEach((m) => add(m.user));
  const space = activeProject?.spaceId;
  if (space?.owner) {
    if (typeof space.owner === "object" && space.owner._id) add(space.owner);
    else add({ _id: space.owner, name: "Workspace owner", email: "" });
  }
  (space?.members || []).forEach((m) => add(m.user));
  return [...byId.values()].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
}

export default function NewChatModal({ open, onClose }) {
  const dispatch = useDispatch();
  const activeProject = useSelector((s) => s.projects.activeProject);
  const user = useSelector((s) => s.auth.user);
  const [mode, setMode] = useState("dm");
  const [peerId, setPeerId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState(() => new Set());
  const [submitting, setSubmitting] = useState(false);

  const eligibleMembers = useMemo(
    () => collectEligibleMembers(activeProject, user?._id),
    [activeProject, user?._id],
  );

  if (!open) return null;

  const projectId = activeProject?._id;

  const toggleMember = (id) => {
    setGroupMembers((prev) => {
      const next = new Set(prev);
      const key = String(id);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectId) {
      toast.error("Select a project first");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "dm") {
        if (!peerId) {
          toast.error("Choose a teammate");
          setSubmitting(false);
          return;
        }
        await dispatch(createPrivateChat({ userId: peerId, projectId })).unwrap();
        toast.success("Chat opened");
      } else {
        if (!groupName.trim()) {
          toast.error("Enter a group name");
          setSubmitting(false);
          return;
        }
        const ids = [...groupMembers];
        if (ids.length < 1) {
          toast.error("Pick at least one teammate");
          setSubmitting(false);
          return;
        }
        await dispatch(createGroupChat({ name: groupName.trim(), participantIds: ids, projectId })).unwrap();
        toast.success("Group created");
      }
      onClose();
      setPeerId("");
      setGroupName("");
      setGroupMembers(new Set());
      setMode("dm");
    } catch (err) {
      toast.error(typeof err === "string" ? err : err?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-chat-title"
      onMouseDown={(ev) => {
        if (ev.target === ev.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-soft)]">
        <h2 id="new-chat-title" className="text-lg font-semibold text-[var(--color-text-primary)]">
          New conversation
        </h2>
        <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">
          Includes project members and everyone in this workspace (e.g. admins).
        </p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("dm")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              mode === "dm"
                ? "bg-indigo-600 text-white"
                : "bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]"
            }`}
          >
            Direct
          </button>
          <button
            type="button"
            onClick={() => setMode("group")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              mode === "group"
                ? "bg-indigo-600 text-white"
                : "bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]"
            }`}
          >
            Group
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {mode === "dm" ? (
            <label className="block">
              <span className="text-[12px] font-medium text-[var(--color-text-secondary)]">Person</span>
              <select
                className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none ring-indigo-500/30 focus:ring-2"
                value={peerId}
                onChange={(e) => setPeerId(e.target.value)}
              >
                <option value="">Select…</option>
                {eligibleMembers.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name}
                    {m.email ? ` · ${m.email}` : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <>
              <label className="block">
                <span className="text-[12px] font-medium text-[var(--color-text-secondary)]">Group name</span>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none ring-indigo-500/30 focus:ring-2"
                  placeholder="e.g. Design review"
                  maxLength={80}
                />
              </label>
              <div>
                <span className="text-[12px] font-medium text-[var(--color-text-secondary)]">Members</span>
                <ul className="mt-2 max-h-44 space-y-0.5 overflow-y-auto rounded-lg border border-[var(--color-border)] p-2">
                  {eligibleMembers.map((m) => {
                    const sel = groupMembers.has(String(m._id));
                    return (
                      <li key={m._id}>
                        <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[var(--color-surface-hover)]">
                          <input type="checkbox" checked={sel} onChange={() => toggleMember(m._id)} />
                          <span className="min-w-0 flex-1 text-[var(--color-text-primary)]">
                            <span className="font-medium">{m.name}</span>
                            {m.email ? (
                              <span className="mt-0.5 block truncate text-[11px] text-[var(--color-text-muted)]">
                                {m.email}
                              </span>
                            ) : null}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "…" : mode === "dm" ? "Open chat" : "Create group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
