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

        <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-card)_88%,transparent)] px-6 py-4 backdrop-blur-sm">
          <h3 className="text-base font-semibold tracking-tight text-[var(--color-text-primary)]">Edit Board Columns</h3>
          <button type="button" onClick={onClose} className="app-modal-close" aria-label="Close">
            ×
          </button>
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
                className="app-control min-w-0 flex-1 px-3 py-2"
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
            className="mt-2 w-full rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] py-2 text-sm text-[var(--color-text-muted)] transition duration-200 ease-out hover:border-[var(--color-border)] hover:text-[var(--color-text-secondary)] active:scale-[0.99]"
          >
            + Add Column
          </button>

          {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 border-t border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-card)_92%,transparent)] px-6 py-4 backdrop-blur-sm">
          <button type="button" onClick={onClose} className="app-btn-modal-secondary">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving} className="app-btn-modal-primary">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
