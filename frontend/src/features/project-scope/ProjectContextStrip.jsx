import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaFolder, FaChevronRight } from "react-icons/fa";
import { useViewport } from "../../hooks/useViewport";

/** Compact line: current project + link to board (when a project is selected). */
export default function ProjectContextStrip() {
  const activeProject = useSelector((s) => s.projects.activeProject);
  const { isLgUp } = useViewport();
  if (!activeProject?._id) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-primary)_6%,transparent)] px-3 py-2 text-[12px] dark:bg-[color-mix(in_oklab,var(--color-primary)_10%,transparent)]">
      <FaFolder className="shrink-0 text-[var(--color-primary)] opacity-90" aria-hidden />
      <span className="font-medium text-[var(--color-text-secondary)]">Project</span>
      <FaChevronRight className="text-[9px] text-[var(--color-text-muted)]" aria-hidden />
      <span className="min-w-0 truncate font-semibold text-[var(--color-text-primary)]" title={activeProject.name}>
        {activeProject.name}
      </span>
      {isLgUp ? (
        <Link
          to={`/projects/${activeProject._id}`}
          className="ml-auto shrink-0 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-card)] px-2 py-1 text-[11px] font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        >
          Open board
        </Link>
      ) : (
        <span className="ml-auto shrink-0 rounded-md border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-muted)] px-2 py-1 text-[10px] font-medium text-[var(--color-text-muted)]">
          Board on desktop
        </span>
      )}
    </div>
  );
}
