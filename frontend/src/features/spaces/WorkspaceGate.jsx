import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSpaces, createSpace, setActiveSpace } from "./spaceSlice";
import { Skeleton } from "../../components/ui/Skeleton";

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
      <div className="app-modal-panel w-full max-w-lg max-h-[min(88dvh,720px)] overflow-y-auto p-5 sm:p-6">
        <p className="mb-1 text-[11px] font-medium text-[var(--color-text-muted)]">Workspace</p>
        <h1 className="mb-1.5 text-xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-2xl">
          Choose a workspace
        </h1>
        <p className="mb-5 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
          Select an existing workspace or create a new one to continue.
        </p>

        {loading && (
          <div className="space-y-2" aria-busy="true" aria-label="Loading workspaces">
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
        )}
        {error && !loading && (
          <p className="mb-4 text-[13px] text-red-600 dark:text-red-400">Failed to load workspaces: {error}</p>
        )}

        {spaces.length > 0 && (
          <div className="space-y-2">
            {spaces.map((space) => (
              <button
                key={space._id}
                type="button"
                onClick={() => handleSelect(space)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2.5 text-left shadow-sm transition-colors duration-150 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-muted)]"
              >
                <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">{space.name}</p>
                <p className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">Owner: {space.owner?.name}</p>
              </button>
            ))}
          </div>
        )}

        <div className="mt-5 max-w-md border-t border-[var(--color-border)] pt-5">
          <p className="mb-3 text-[13px] font-semibold text-[var(--color-text-primary)]">
            {spaces.length === 0 ? "Create your first workspace" : "Create a new workspace"}
          </p>

          <input
            value={spaceName}
            onChange={(e) => setSpaceName(e.target.value)}
            placeholder="Workspace name"
            className="app-control mb-3 px-3 py-2 text-[13px] placeholder:text-[var(--color-text-muted)]"
          />

          <button
            type="button"
            disabled={!spaceName}
            onClick={handleCreate}
            className="app-btn-modal-primary w-full justify-center py-2 text-[13px] sm:w-auto"
          >
            Create workspace
          </button>
        </div>
      </div>
    </div>
  );
}
