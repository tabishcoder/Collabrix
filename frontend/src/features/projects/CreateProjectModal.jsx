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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-[var(--color-card)] p-6 rounded-lg w-80">
        <h2 className="text-lg font-semibold mb-4">Create New Project</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-black/20 border border-white/10 mb-4"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-sm"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-3 py-2 bg-[var(--color-primary)] text-white rounded-md text-sm"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
