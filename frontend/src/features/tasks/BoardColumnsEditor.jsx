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
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
      <div className="bg-[#0f0f11] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">

        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <h3 className="text-base font-semibold text-white">Edit Board Columns</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="px-6 py-4 space-y-2 max-h-72 overflow-y-auto">
          {cols.map((col, idx) => (
            <div key={col.key} className="flex items-center gap-2">
              <button
                onClick={() => handleMoveUp(idx)}
                disabled={idx === 0}
                className="text-white/20 hover:text-white/60 disabled:opacity-20 transition"
                title="Move up"
              >
                <FaGripVertical className="text-xs" />
              </button>

              <input
                value={col.name}
                onChange={(e) => handleNameChange(idx, e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
              />

              <button
                onClick={() => handleRemove(idx)}
                className="text-white/25 hover:text-red-400 transition"
                title="Remove column"
              >
                <FaTrash className="text-xs" />
              </button>
            </div>
          ))}

          <button
            onClick={handleAdd}
            className="w-full py-2 rounded-md border border-dashed border-white/15 text-white/40 hover:text-white/70 hover:border-white/30 text-sm transition mt-2"
          >
            + Add Column
          </button>

          {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-white/8 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/5 text-white/60 text-sm hover:bg-white/10 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium transition"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
