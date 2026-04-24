import { useState } from "react";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { createSpace } from "./spaceSlice";

export default function CreateWorkspaceModal({ onClose }) {
  const dispatch = useDispatch();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const n = name.trim();
    if (!n) return;
    setBusy(true);
    try {
      await dispatch(createSpace({ name: n })).unwrap();
      toast.success("Workspace created");
      onClose();
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Could not create workspace");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 app-modal-backdrop">
      <div className="app-modal-panel w-full max-w-md p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">New workspace</h2>
        <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">Create a space for a team or organization.</p>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Workspace name"
          className="app-control mt-4 w-full placeholder:text-[var(--color-text-muted)]"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md px-3 py-1.5 text-[13px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]">
            Cancel
          </button>
          <button
            type="button"
            disabled={busy || !name.trim()}
            onClick={submit}
            className="rounded-md bg-[var(--color-primary)] px-3 py-1.5 text-[13px] font-medium text-white disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
