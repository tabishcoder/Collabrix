import ProjectScopedModule from "../project-scope/ProjectScopedModule";

export default function ChatsPage() {
  return (
    <ProjectScopedModule
      title="Chats"
      description="Project-scoped conversations will appear here. Channels and threads will be tied to this board’s team."
    >
      <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-card)]/60 px-4 py-10 text-center text-[13px] text-[var(--color-text-muted)]">
        Messaging for this project is not wired up yet — layout and scope are ready for when you connect the API.
      </div>
    </ProjectScopedModule>
  );
}
