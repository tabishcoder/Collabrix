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
        <p className="mb-5 text-xs text-[var(--color-text-muted)]">Add a project in the current workspace.</p>

        <form onSubmit={handleSubmit}>
          <label className="mb-1.5 block text-xs text-[var(--color-text-muted)]">Name</label>
          <input
            type="text"
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="app-control mb-5 px-3 py-2.5 placeholder:text-[var(--color-text-muted)]"
          />

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="app-btn-modal-secondary !px-3">
              Cancel
            </button>

            <button type="submit" className="app-btn-modal-primary !px-3">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
