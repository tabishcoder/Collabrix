import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSpaces, createSpace, setActiveSpace } from "./spaceSlice";

export default function WorkspaceGate() {
  const dispatch = useDispatch();
  const { spaces, loading, error } = useSelector((s) => s.spaces);
  const [spaceName, setSpaceName] = useState("");

  useEffect(() => {
    if (!spaces.length) dispatch(fetchSpaces());
  }, [dispatch, spaces.length]);

  const handleSelect = (space) => {
    dispatch(setActiveSpace(space));
  };

  const handleCreate = async () => {
    if (!spaceName) return;
    const space = await dispatch(createSpace({ name: spaceName })).unwrap();
    dispatch(setActiveSpace(space));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 app-modal-backdrop">
      <div className="app-modal-panel w-full max-w-lg max-h-[min(88dvh,720px)] overflow-y-auto p-6 sm:p-8">
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
          Choose a workspace
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          Select an existing workspace or create a new one to continue.
        </p>

        {loading && (
          <p className="text-[var(--color-text-secondary)] flex items-center gap-2 text-sm">
            <span className="w-3 h-3 border-2 border-[var(--color-border-strong)] border-t-indigo-400 rounded-full animate-spin inline-block" />
            Loading workspaces...
          </p>
        )}
        {error && !loading && (
          <p className="text-red-400 text-sm">Failed to load workspaces: {error}</p>
        )}

        {spaces.length > 0 && (
          <div className="space-y-3">
            {spaces.map((space) => (
              <button
                key={space._id}
                type="button"
                onClick={() => handleSelect(space)}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-left transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-hover)]"
              >
                <p className="font-medium text-[var(--color-text-primary)]">
                  {space.name}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Owner: {space.owner?.name}
                </p>
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 max-w-md">
          <p className="mb-4 text-lg text-[var(--color-text-primary)]">
            {spaces.length === 0
              ? "Welcome! Create your first workspace 🚀"
              : "Or create a new workspace"}
          </p>

          <input
            value={spaceName}
            onChange={(e) => setSpaceName(e.target.value)}
            placeholder="Workspace name"
            className="w-full px-4 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-bg)] border border-[var(--color-border-strong)] mb-4 outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-indigo-500/55"
          />

          <button
            type="button"
            disabled={!spaceName}
            onClick={handleCreate}
            className="px-4 py-2.5 rounded-[var(--radius-md)] bg-indigo-600 text-white font-medium disabled:opacity-50 hover:bg-[var(--color-primary-hover)] shadow-lg shadow-indigo-600/20 transition"
          >
            Create Workspace
          </button>
        </div>
      </div>
    </div>
  );
}
