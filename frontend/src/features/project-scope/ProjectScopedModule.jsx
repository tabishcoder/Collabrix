import { useSelector } from "react-redux";
import NoProjectSelected from "./NoProjectSelected";
import ProjectContextStrip from "./ProjectContextStrip";

/**
 * Wraps project-specific modules (chats, meetings, AI). Requires activeProject from Redux (header picker).
 * @param {{ compact?: boolean }} props — compact: tighter header + max height for embedded panels (e.g. Chats).
 */
export default function ProjectScopedModule({ title, description, children, compact = false }) {
  const activeProject = useSelector((s) => s.projects.activeProject);

  if (!activeProject?._id) {
    return <NoProjectSelected moduleLabel={title} />;
  }

  return (
    <div
      className={
        compact
          ? "flex min-h-0 flex-1 flex-col gap-2"
          : "space-y-5"
      }
    >
      <ProjectContextStrip />
      <header className={`max-w-2xl shrink-0 ${compact ? "space-y-0.5" : "space-y-1"}`}>
        {!compact && (
          <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">{title}</p>
        )}
        <h1
          className={
            compact
              ? "text-lg font-semibold tracking-tight text-[var(--color-text-primary)]"
              : "text-xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-2xl"
          }
        >
          {title}
        </h1>
        {description && (
          <p
            className={
              compact
                ? "line-clamp-1 text-[12px] leading-snug text-[var(--color-text-secondary)]"
                : "text-[13px] leading-relaxed text-[var(--color-text-secondary)]"
            }
          >
            {description}
          </p>
        )}
      </header>
      {compact ? <div className="flex min-h-0 flex-1 flex-col">{children}</div> : children}
    </div>
  );
}
