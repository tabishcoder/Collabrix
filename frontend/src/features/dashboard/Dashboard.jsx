import { Link } from "react-router-dom";
import { FaProjectDiagram, FaComments, FaUsers, FaRobot } from "react-icons/fa";

const tiles = [
  {
    to: "/projects",
    title: "Projects",
    description: "Boards, tasks, and delivery in one place.",
    icon: FaProjectDiagram,
  },
  {
    to: "/chats",
    title: "Chats",
    description: "Team conversations — coming soon.",
    icon: FaComments,
  },
  {
    to: "/meetings",
    title: "Meetings",
    description: "Schedule and sync — coming soon.",
    icon: FaUsers,
  },
  {
    to: "/aibot",
    title: "AI assistant",
    description: "Context-aware help — coming soon.",
    icon: FaRobot,
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <header className="max-w-2xl space-y-1.5">
        <p className="text-[11px] font-medium text-[var(--color-text-muted)]">Overview</p>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-2xl">
          Dashboard
        </h1>
        <p className="text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
          Pick a module to get started. Your workspace and permissions stay in sync everywhere.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map(({ to, title, description, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="group flex flex-col rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm transition-colors duration-150 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-muted)]/40"
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] transition-colors duration-150 group-hover:border-[var(--color-border-strong)] group-hover:text-[var(--color-primary)]">
              <Icon className="text-[15px]" aria-hidden />
            </div>
            <h2 className="text-[13px] font-semibold tracking-tight text-[var(--color-text-primary)]">{title}</h2>
            <p className="mt-1 flex-1 text-[11px] leading-relaxed text-[var(--color-text-muted)]">{description}</p>
            <span className="mt-3 text-[11px] font-medium text-[var(--color-text-secondary)] transition-colors duration-150 group-hover:text-[var(--color-primary)]">
              Open →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
