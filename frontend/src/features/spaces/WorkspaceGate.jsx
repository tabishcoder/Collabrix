import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSpaces, createSpace, setActiveSpace } from "./spaceSlice";

export default function WorkspaceGate() {
  const dispatch = useDispatch();
  const { spaces, loading } = useSelector((s) => s.spaces);
  const [spaceName, setSpaceName] = useState("");

  useEffect(() => {
    if (!spaces.length) dispatch(fetchSpaces());
  }, [dispatch]);

  const handleSelect = (space) => {
    dispatch(setActiveSpace(space));
  };

  const handleCreate = async () => {
    if (!spaceName) return;
    const space = await dispatch(createSpace({ name: spaceName })).unwrap();
    dispatch(setActiveSpace(space));
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
      <div className="w-[80vw] h-[80vh] bg-[var(--color-card)] rounded-xl p-6 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6 text-[var(--color-primary)]">
          Choose a Workspace
        </h1>

        {loading && <p>Loading workspaces...</p>}

        {spaces.length > 0 && (
          <div className="space-y-3">
            {spaces.map((space) => (
              <button
                key={space._id}
                onClick={() => handleSelect(space)}
                className="w-full text-left px-4 py-3 rounded-md bg-white/5 hover:bg-white/10 transition"
              >
                <p className="font-medium text-[var(--color-text-primary)]">
                  {space.name}
                </p>
                <p className="text-xs opacity-70 text-[var(--color-text-secondary)]">
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
            className="w-full px-4 py-2 rounded-md bg-black/40 mb-4 outline-none text-[var(--color-text-primary)] placeholder:text-gray-400"
          />

          <button
            disabled={!spaceName}
            onClick={handleCreate}
            className="px-4 py-2 rounded-md bg-[var(--color-primary)] text-white font-medium disabled:opacity-50 hover:bg-[var(--color-highlight)] transition"
          >
            Create Workspace
          </button>
        </div>
      </div>
    </div>
  );
}
