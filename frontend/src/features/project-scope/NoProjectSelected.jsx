import { Link } from "react-router-dom";
import { FaFolder } from "react-icons/fa";

export default function NoProjectSelected({ moduleLabel }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-6 py-12 text-center shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-primary)]">
        <FaFolder className="text-lg" aria-hidden />
      </div>
      <div className="space-y-1.5">
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Select a project first</h1>
        <p className="text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
          {moduleLabel ? (
            <>
              <span className="font-medium text-[var(--color-text-primary)]">{moduleLabel}</span> is scoped to the
              project you choose in the header. Open the <span className="font-medium">Project</span> menu and pick a
              board, or open Projects below.
            </>
          ) : (
            <>Use the <span className="font-medium">Project</span> menu in the header to choose which board this area applies to.</>
          )}
        </p>
      </div>
      <Link
        to="/projects"
        className="text-[13px] font-medium text-[var(--color-primary)] hover:underline"
      >
        Go to projects
      </Link>
    </div>
  );
}
