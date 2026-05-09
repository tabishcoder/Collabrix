import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  FaProjectDiagram,
  FaComments,
  FaUsers,
  FaRobot,
  FaUserFriends,
  FaTasks,
  FaPlus,
} from "react-icons/fa";

import { canManageSpace, canManageProject, spaceRoleLabel, projectRoleLabel } from "../../utils/roles";
import ProjectContextStrip from "../project-scope/ProjectContextStrip";
import CreateWorkspaceModal from "../spaces/CreateWorkspaceModal";
import { useViewport } from "../../hooks/useViewport";

function RoleIntro({ role, spaceName, projectCount, isSpaceAdmin, needsWorkspace }) {
  if (needsWorkspace) {
    return (
      <>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-2xl">
          Welcome to Collabrix
        </h1>
        <p className="text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
          You are signed in, but you are not inside a workspace yet. Create one for your team or join with an invite link to unlock chats, meetings, boards, and AI assistance scoped to your projects.
        </p>
      </>
    );
  }

  if (!role) {
    return (
      <>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-2xl">
          Overview
        </h1>
        <p className="text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
          Pick a module to get started. Use the workspace menu in the header to switch tenants or invite teammates.
        </p>
      </>
    );
  }

  const label = spaceRoleLabel(role);
  const nameBit = spaceName ? ` in “${spaceName}”` : "";

  if (role === "owner") {
    return (
      <>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-2xl">
          Workspace overview
        </h1>
        <p className="text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
          You are the <span className="font-medium text-[var(--color-text-primary)]">{label}</span>
          {nameBit}. You can manage workspace members, invites, and all projects. This workspace currently has{" "}
          <span className="tabular-nums font-medium text-[var(--color-text-primary)]">{projectCount}</span>{" "}
          {projectCount === 1 ? "project" : "projects"}.
        </p>
        <p className="text-[12px] leading-relaxed text-[var(--color-text-muted)]">
          Use <span className="font-medium text-[var(--color-text-secondary)]">Projects</span> to organize delivery;
          invite teammates from the workspace menu when you are ready to scale the team.
        </p>
      </>
    );
  }

  if (role === "admin") {
    return (
      <>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-2xl">
          Workspace overview
        </h1>
        <p className="text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
          You are an <span className="font-medium text-[var(--color-text-primary)]">{label}</span>
          {nameBit}. You can help the owner manage members, invites, and project access. There are{" "}
          <span className="tabular-nums font-medium text-[var(--color-text-primary)]">{projectCount}</span>{" "}
          {projectCount === 1 ? "project" : "projects"} in this workspace.
        </p>
        <p className="text-[12px] leading-relaxed text-[var(--color-text-muted)]">
          {isSpaceAdmin
            ? "Open Projects to create boards or coordinate work; use the workspace menu to invite people or adjust roles where permitted."
            : "Open Projects to jump into the boards you have access to."}
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-2xl">
        Your workspace
      </h1>
      <p className="text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
        You are a <span className="font-medium text-[var(--color-text-primary)]">{label}</span>
        {nameBit}. You can collaborate on projects you are added to. This workspace lists{" "}
        <span className="tabular-nums font-medium text-[var(--color-text-primary)]">{projectCount}</span>{" "}
        {projectCount === 1 ? "project" : "projects"} overall — you will only see boards where you have a role.
      </p>
      <p className="text-[12px] leading-relaxed text-[var(--color-text-muted)]">
        Ask an owner or admin if you need access to another project, or use Projects to open an existing board.
      </p>
    </>
  );
}

export default function WorkspaceDashboard() {
  const { activeSpaceRole, activeSpace } = useSelector((s) => s.spaces);
  const { projects, activeProject } = useSelector((s) => s.projects);
  const chats = useSelector((s) => s.chats.chats);
  const projectCount = projects?.length ?? 0;
  const isSpaceAdmin = canManageSpace(activeSpaceRole);
  const needsWorkspace = !activeSpace;
  const { isLgUp, isBetween } = useViewport();

  const [createWsOpen, setCreateWsOpen] = useState(false);

  const moduleTiles = useMemo(() => {
    if (!activeSpace) return [];

    const boardTo = activeProject?._id ? `/projects/${activeProject._id}` : "/projects";
    const scoped = "Uses the project selected in the header.";
    const tiles = [];

    if (isLgUp) {
      tiles.push({
        to: boardTo,
        title: "Projects & boards",
        description: "Kanban, tasks, and delivery — best on large screens.",
        icon: FaProjectDiagram,
      });
    }

    tiles.push(
      {
        to: "/chats",
        title: "Chats",
        description: activeProject?._id
          ? `Project chats — ${scoped}`
          : "Team conversations — select a project in the header.",
        icon: FaComments,
      },
      {
        to: "/meetings",
        title: "Meetings",
        description: activeProject?._id
          ? `Project meetings — ${scoped}`
          : "Schedule and sync — select a project in the header.",
        icon: FaUsers,
      },
      {
        to: "/aibot",
        title: "AI assistant",
        description: activeProject?._id
          ? `Project-aware AI — ${scoped}`
          : "Context-aware help — select a project in the header.",
        icon: FaRobot,
      },
    );

    return tiles;
  }, [activeProject?._id, activeSpace, isLgUp]);

  const { managed, contributing, viewing } = useMemo(() => {
    const list = projects || [];
    return {
      managed: list.filter((p) => canManageProject(p.myRole)),
      contributing: list.filter((p) => p.myRole === "contributor"),
      viewing: list.filter((p) => p.myRole === "viewer"),
    };
  }, [projects]);

  const showBoardSections = Boolean(activeSpace && isLgUp);
  const chatCount = Array.isArray(chats) ? chats.length : 0;

  return (
    <div className="space-y-8 overflow-x-hidden">
      <ProjectContextStrip />

      {needsWorkspace && (
        <section
          aria-label="Get started"
          className="rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-soft)] sm:p-6"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Next step
          </p>
          <h2 className="mt-1 text-[16px] font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-lg">
            Create or join a workspace
          </h2>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
            Workspaces separate people, projects, and permissions. Once you are inside one, chats and meetings open up on this device; full kanban boards appear on wider desktop layouts.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() => setCreateWsOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-[var(--color-primary-hover)]"
            >
              <FaPlus className="text-[11px]" aria-hidden />
              Create workspace
            </button>
            <Link
              to="/join-workspace"
              className="inline-flex items-center justify-center rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface-muted)] px-4 py-2.5 text-[13px] font-semibold text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-border)] hover:bg-[var(--color-card)]"
            >
              I have an invite link
            </Link>
          </div>
        </section>
      )}

      <header className="max-w-2xl space-y-1.5">
        <p className="text-[11px] font-medium text-[var(--color-text-muted)]">Overview</p>
        <RoleIntro
          role={activeSpaceRole}
          spaceName={activeSpace?.name}
          projectCount={projectCount}
          isSpaceAdmin={isSpaceAdmin}
          needsWorkspace={needsWorkspace}
        />
      </header>

      {activeSpace && activeSpaceRole && (
        <section aria-label="Quick snapshot">
          <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Snapshot
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-primary)]">
                <FaTasks className="text-[15px]" aria-hidden />
              </div>
              <p className="text-[11px] font-medium text-[var(--color-text-muted)]">Projects</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--color-text-primary)]">{projectCount}</p>
            </div>
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-primary)]">
                <FaComments className="text-[15px]" aria-hidden />
              </div>
              <p className="text-[11px] font-medium text-[var(--color-text-muted)]">Chats (this project)</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--color-text-primary)]">{chatCount}</p>
              <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">Loads when a project is selected</p>
            </div>
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-primary)]">
                <FaUsers className="text-[15px]" aria-hidden />
              </div>
              <p className="text-[11px] font-medium text-[var(--color-text-muted)]">Meetings</p>
              <p className="mt-1 text-[13px] font-medium leading-snug text-[var(--color-text-secondary)]">
                Schedule from the Meetings module — scoped to your selected project.
              </p>
            </div>
          </div>
        </section>
      )}

      {activeSpace && activeSpaceRole && (
        <section aria-label="Role summary">
          <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Your involvement
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-primary)]">
                <FaUserFriends className="text-[15px]" aria-hidden />
              </div>
              <p className="text-[11px] font-medium text-[var(--color-text-muted)]">Boards you manage</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--color-text-primary)]">{managed.length}</p>
              <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">Owner, admin, or manager on a project</p>
            </div>
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-primary)]">
                <FaProjectDiagram className="text-[15px]" aria-hidden />
              </div>
              <p className="text-[11px] font-medium text-[var(--color-text-muted)]">Contributing / view-only</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--color-text-primary)]">
                {contributing.length + viewing.length}
              </p>
              <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">Contributor or viewer access</p>
            </div>
          </div>
        </section>
      )}

      {showBoardSections && managed.length > 0 && (
        <section aria-label="Projects you lead">
          <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Projects you run
          </h2>
          <p className="mb-3 max-w-2xl text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
            You have manager-level access (including workspace owners and admins). Open a board to edit members,
            columns, and tasks.
          </p>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {managed.map((p) => (
              <li key={p._id}>
                <Link
                  to={`/projects/${p._id}`}
                  className="flex flex-col rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3 shadow-sm transition-colors duration-150 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-muted)]/40"
                >
                  <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">{p.name}</span>
                  <span className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                    {p.members?.length ?? 0} board member{(p.members?.length ?? 0) !== 1 ? "s" : ""} ·{" "}
                    {projectRoleLabel(p.myRole)}
                  </span>
                  <span className="mt-2 text-[11px] font-medium text-[var(--color-primary)]">Open board →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {showBoardSections && (contributing.length > 0 || viewing.length > 0) && (
        <section aria-label="Other project access">
          <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Other boards
          </h2>
          <ul className="flex flex-wrap gap-2">
            {[...contributing, ...viewing].map((p) => (
              <li key={p._id}>
                <Link
                  to={`/projects/${p._id}`}
                  className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1.5 text-[12px] font-medium text-[var(--color-text-secondary)] shadow-sm hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
                >
                  {p.name}
                  <span className="text-[10px] font-normal text-[var(--color-text-muted)]">
                    {projectRoleLabel(p.myRole)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeSpace && isBetween && (
        <p className="rounded-lg border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-card)_92%,transparent)] px-3 py-2 text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
          <span className="font-medium text-[var(--color-text-primary)]">Tip:</span> project boards and full-width task columns are enabled from{" "}
          <span className="tabular-nums">1024px</span> width and up. Use chats, meetings, and AI on this screen size.
        </p>
      )}

      {moduleTiles.length > 0 && (
        <section aria-label="Modules">
          <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Modules</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {moduleTiles.map(({ to, title, description, icon: Icon }) => (
              <Link
                key={`${title}-${to}`}
                to={to}
                className="group flex min-h-0 flex-col rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm transition-colors duration-150 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-muted)]/40"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] transition-colors duration-150 group-hover:border-[var(--color-border-strong)] group-hover:text-[var(--color-primary)]">
                  <Icon className="text-[15px]" aria-hidden />
                </div>
                <h3 className="text-[13px] font-semibold tracking-tight text-[var(--color-text-primary)]">{title}</h3>
                <p className="mt-1 flex-1 text-[11px] leading-relaxed text-[var(--color-text-muted)]">{description}</p>
                <span className="mt-3 text-[11px] font-medium text-[var(--color-text-secondary)] transition-colors duration-150 group-hover:text-[var(--color-primary)]">
                  Open →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {createWsOpen && <CreateWorkspaceModal onClose={() => setCreateWsOpen(false)} />}
    </div>
  );
}
