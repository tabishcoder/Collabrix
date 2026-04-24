import { useState } from "react";
import { FaTrash, FaGripVertical } from "react-icons/fa";

export default function BoardColumnsEditor({ columns, saving, onSave, onClose }) {
  const [cols, setCols] = useState(
    columns.map((c, i) => ({ ...c, order: i }))
  );
  const [error, setError] = useState("");

  const handleNameChange = (idx, val) => {
    setCols((prev) => prev.map((c, i) => i === idx ? { ...c, name: val } : c));
  };

  const handleAdd = () => {
    const newKey = `column_${Date.now()}`;
    setCols((prev) => [...prev, { key: newKey, name: "New Column", order: prev.length }]);
  };

  const handleRemove = (idx) => {
    if (cols.length <= 1) { setError("A board must have at least one column."); return; }
    setError("");
    setCols((prev) => prev.filter((_, i) => i !== idx).map((c, i) => ({ ...c, order: i })));
  };

  const handleMoveUp = (idx) => {
    if (idx === 0) return;
    setCols((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next.map((c, i) => ({ ...c, order: i }));
    });
  };

  const handleSave = () => {
    const names = cols.map((c) => c.name.trim());
    if (names.some((n) => !n)) { setError("Column names cannot be empty."); return; }
    setError("");
    const payload = cols.map((c, i) => ({
      key:   c.key,
      name:  c.name.trim(),
      order: i
    }));
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10 sm:py-12 app-modal-backdrop">
      <div className="app-modal-panel w-full max-w-md overflow-hidden">

        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <h3 className="text-base font-semibold tracking-tight text-[var(--color-text-primary)]">Edit Board Columns</h3>
          <button type="button" onClick={onClose} className="rounded-[var(--radius-sm)] px-1.5 py-0.5 text-xl leading-none text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]">×</button>
        </div>

        <div className="px-6 py-4 space-y-2 max-h-72 overflow-y-auto">
          {cols.map((col, idx) => (
            <div key={col.key} className="flex items-center gap-2">
              <button
                onClick={() => handleMoveUp(idx)}
                disabled={idx === 0}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] disabled:opacity-20 transition"
                title="Move up"
              >
                <FaGripVertical className="text-xs" />
              </button>

              <input
                value={col.name}
                onChange={(e) => handleNameChange(idx, e.target.value)}
                className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-input-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-indigo-500/55 focus:outline-none"
              />

              <button
                onClick={() => handleRemove(idx)}
                className="text-[var(--color-text-muted)] transition hover:text-red-500 dark:hover:text-red-400"
                title="Remove column"
              >
                <FaTrash className="text-xs" />
              </button>
            </div>
          ))}

          <button
            onClick={handleAdd}
            className="w-full py-2 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:border-[var(--color-border)] text-sm transition mt-2"
          >
            + Add Column
          </button>

          {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-[var(--color-border)] flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-2 text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-[var(--radius-md)] bg-indigo-600 hover:bg-[var(--color-primary-hover)] disabled:opacity-60 text-white text-sm font-medium shadow-lg shadow-indigo-600/20 transition"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
