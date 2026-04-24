import ProjectScopedModule from "../project-scope/ProjectScopedModule";

export default function AIAssistantPage() {
  return (
    <ProjectScopedModule
      title="AI assistant"
      description="When enabled, the assistant will use this project’s tasks and context by default."
    >
      <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-card)]/60 px-4 py-10 text-center text-[13px] text-[var(--color-text-muted)]">
        AI tools for this project are not connected yet — the shell is scoped to your current project from the header.
      </div>
    </ProjectScopedModule>
  );
}
