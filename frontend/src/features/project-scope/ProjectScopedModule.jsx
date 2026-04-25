import { useSelector } from "react-redux";
import NoProjectSelected from "./NoProjectSelected";
import ProjectContextStrip from "./ProjectContextStrip";

/**
 * Wraps project-specific modules (chats, meetings, AI). Requires activeProject from Redux (header picker).
 */
export default function ProjectScopedModule({ title, description, children }) {
  const activeProject = useSelector((s) => s.projects.activeProject);

  if (!activeProject?._id) {
    return <NoProjectSelected moduleLabel={title} />;
  }

  return (
    <div className="space-y-5">
      <ProjectContextStrip />
      <header className="max-w-2xl space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">{title}</p>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-2xl">{title}</h1>
        {description && (
          <p className="text-[13px] leading-relaxed text-[var(--color-text-secondary)]">{description}</p>
        )}
      </header>
      {children}
    </div>
  );
}
