import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createProject } from "./projectSlice";
import { useNavigate } from "react-router-dom";

export default function CreateProjectModal({ onClose }) {
  const [name, setName] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { activeSpace } = useSelector((s) => s.spaces);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) return;

    const result = await dispatch(
      createProject({
        name,
        spaceId: activeSpace._id,
      }),
    );

    if (result.payload?._id) {
      navigate(`/projects/${result.payload._id}`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10 app-modal-backdrop">
      <div className="app-modal-panel w-full max-w-sm p-6 sm:p-7">
        <h2 className="mb-1 text-lg font-semibold tracking-tight text-[var(--color-text-primary)]">Create New Project</h2>
        <p className="text-xs text-[var(--color-text-muted)] mb-5">Add a project in the current workspace.</p>

        <form onSubmit={handleSubmit}>
          <label className="text-xs text-[var(--color-text-muted)] mb-1.5 block">Name</label>
          <input
            type="text"
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-5 w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-input-bg)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-indigo-500/55 focus:outline-none"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-3 py-2 bg-indigo-600 hover:bg-[var(--color-primary-hover)] text-white rounded-[var(--radius-md)] text-sm font-medium shadow-lg shadow-indigo-600/20 transition"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
