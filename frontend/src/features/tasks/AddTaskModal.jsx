// src/features/tasks/AddTaskModal.jsx
import { useState } from "react";
import { useDispatch } from "react-redux";
import { addTask } from "./tasksSlice";

export default function AddTaskModal({ projectId, onClose }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const dispatch = useDispatch();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim()) return; // simple validation

    // backend doc expects projectId key
    dispatch(
      addTask({
        title,
        description,
        projectId, // use projectId (not 'project') to match backend doc
        status: "todo",
      }),
    );

    // reset inputs (optional)
    setTitle("");
    setDescription("");

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
      <div className="bg-[var(--color-card)] p-6 rounded-xl w-96 border border-white/10">
        <h3 className="mb-4 font-semibold text-lg">Create New Task</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full p-2 rounded bg-[var(--color-bg)] border border-white/10 focus:outline-none focus:border-[var(--color-primary)]"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <textarea
            className="w-full p-2 rounded bg-[var(--color-bg)] border border-white/10 focus:outline-none focus:border-[var(--color-primary)]"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-[var(--color-text-secondary)] hover:text-white"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-4 py-2 rounded bg-[var(--color-primary)] text-white hover:opacity-90"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
