import ProjectScopedModule from "../project-scope/ProjectScopedModule";

export default function MeetingsPage() {
  return (
    <ProjectScopedModule
      title="Meetings"
      description="Schedules and recordings for this project will live here, separate from other boards in the workspace."
    >
      <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-card)]/60 px-4 py-10 text-center text-[13px] text-[var(--color-text-muted)]">
        Meeting scheduling for this project is coming soon — navigation is already scoped to the selected project.
      </div>
    </ProjectScopedModule>
  );
}
