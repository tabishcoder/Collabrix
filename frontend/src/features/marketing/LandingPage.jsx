import { Link } from "react-router-dom";
import {
  FaBolt,
  FaComments,
  FaTasks,
  FaUsers,
  FaShieldAlt,
  FaArrowRight,
} from "react-icons/fa";
import ThemeToggle from "../../theme/ThemeToggle";

function Pill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-card)] px-3 py-1 text-[11px] font-medium text-[var(--color-text-secondary)] shadow-sm">
      {children}
    </span>
  );
}

export default function LandingPage() {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        aria-hidden
      >
        <div className="absolute -left-24 top-[-10%] h-[420px] w-[420px] rounded-full bg-[color-mix(in_oklab,var(--color-primary)_22%,transparent)] blur-3xl" />
        <div className="absolute right-[-10%] top-[18%] h-[380px] w-[380px] rounded-full bg-[color-mix(in_oklab,var(--color-accent)_18%,transparent)] blur-3xl" />
        <div className="absolute bottom-[-18%] left-[22%] h-[360px] w-[360px] rounded-full bg-[color-mix(in_oklab,var(--color-highlight)_14%,transparent)] blur-3xl" />
      </div>

      <header className="relative z-10 border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-card)_82%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)] text-[13px] font-bold text-white shadow-sm">
              C
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold tracking-tight">Collabrix</p>
              <p className="truncate text-[11px] text-[var(--color-text-muted)]">Workspaces, chats & boards</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link
              to="/login"
              className="rounded-lg px-3 py-2 text-[13px] font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="hidden rounded-lg bg-[var(--color-primary)] px-3 py-2 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-[var(--color-primary-hover)] sm:inline-flex"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14">
        <section className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-12">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <Pill>Pixel-ready UI</Pill>
              <Pill>Realtime collaboration</Pill>
              <Pill>Workspace-first</Pill>
            </div>

            <div className="space-y-3">
              <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[2.65rem] lg:leading-[1.08]">
                Ship faster with a workspace your team actually wants to use.
              </h1>
              <p className="max-w-xl text-pretty text-[15px] leading-relaxed text-[var(--color-text-secondary)] sm:text-[16px]">
                Collabrix brings meetings, chats, and delivery boards into one calm surface — without sacrificing clarity on smaller screens.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-3 text-[14px] font-semibold text-white shadow-[var(--shadow-soft)] transition-colors hover:bg-[var(--color-primary-hover)]"
              >
                Create free account
                <FaArrowRight className="text-[12px] opacity-90" aria-hidden />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-card)] px-5 py-3 text-[14px] font-semibold text-[var(--color-text-primary)] shadow-sm transition-colors hover:border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]"
              >
                I already have an account
              </Link>
            </div>

            <p className="text-[12px] leading-relaxed text-[var(--color-text-muted)]">
              Tip: Boards shine on large screens; chats and meetings stay front-and-center on tablets and phones.
            </p>
          </div>

          <div className="relative">
            <div className="rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-card)] p-4 shadow-[var(--shadow-soft)] sm:p-5">
              <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                    Preview
                  </p>
                  <p className="text-[14px] font-semibold text-[var(--color-text-primary)]">Workspace overview</p>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-200">
                  Live-ready
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]/35 p-3">
                  <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                    <FaComments className="text-[14px] text-[var(--color-primary)]" aria-hidden />
                    <p className="text-[12px] font-semibold text-[var(--color-text-primary)]">Chats</p>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-[var(--color-text-muted)]">
                    Channels, DMs, and project threads — scoped cleanly.
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]/35 p-3">
                  <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                    <FaUsers className="text-[14px] text-[var(--color-accent)]" aria-hidden />
                    <p className="text-[12px] font-semibold text-[var(--color-text-primary)]">Meetings</p>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-[var(--color-text-muted)]">
                    Jump from agenda to action without losing context.
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]/35 p-3">
                  <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                    <FaTasks className="text-[14px] text-[var(--color-highlight)]" aria-hidden />
                    <p className="text-[12px] font-semibold text-[var(--color-text-primary)]">Boards</p>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-[var(--color-text-muted)]">
                    Kanban-style delivery — tuned for desktop widths.
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]/35 p-3">
                  <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                    <FaBolt className="text-[14px] text-amber-600 dark:text-amber-300" aria-hidden />
                    <p className="text-[12px] font-semibold text-[var(--color-text-primary)]">AI assist</p>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-[var(--color-text-muted)]">
                    Context-aware help alongside your workspace data.
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-dashed border-[var(--color-border-strong)] bg-[color-mix(in_oklab,var(--color-bg)_70%,transparent)] p-3">
                <div className="flex items-start gap-2">
                  <FaShieldAlt className="mt-0.5 shrink-0 text-[14px] text-[var(--color-text-muted)]" aria-hidden />
                  <p className="text-[11px] leading-relaxed text-[var(--color-text-secondary)]">
                    Security-minded defaults: workspace boundaries, role-aware UI, and sessions that remember your last workspace choice.
                  </p>
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute -bottom-6 -right-4 hidden h-28 w-28 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-card)] sm:block" />
          </div>
        </section>

        <section className="mt-14 grid gap-4 border-t border-[var(--color-border)] pt-10 sm:grid-cols-3">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm">
            <p className="text-[12px] font-semibold text-[var(--color-text-primary)]">Responsive by design</p>
            <p className="mt-2 text-[12px] leading-relaxed text-[var(--color-text-muted)]">
              Narrow viewports prioritize conversations and meetings; boards unlock when there is room to think.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm">
            <p className="text-[12px] font-semibold text-[var(--color-text-primary)]">Workspace memory</p>
            <p className="mt-2 text-[12px] leading-relaxed text-[var(--color-text-muted)]">
              Your last workspace selection is restored automatically — fewer interruptions, more flow.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm">
            <p className="text-[12px] font-semibold text-[var(--color-text-primary)]">Focused onboarding</p>
            <p className="mt-2 text-[12px] leading-relaxed text-[var(--color-text-muted)]">
              New accounts land on a guided dashboard until a workspace exists — so features stay understandable.
            </p>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-card)_78%,transparent)] py-6 text-center text-[12px] text-[var(--color-text-muted)] backdrop-blur-md">
        <p className="px-4">
          © {new Date().getFullYear()} Collabrix · Built for teams who care about UI quality.
        </p>
        <div className="mt-3 flex justify-center gap-4">
          <Link to="/login" className="font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            Login
          </Link>
          <Link to="/register" className="font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            Register
          </Link>
        </div>
      </footer>
    </div>
  );
}
