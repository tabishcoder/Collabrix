import { useState } from "react";
import { FaChevronDown } from "react-icons/fa";

const FAQS = [
  {
    id: "workspace",
    q: "What is a workspace?",
    a: "A workspace groups people and projects under one tenant. Pick or create a workspace in the header to load chats, meetings, and boards for that team.",
  },
  {
    id: "switch-workspace",
    q: "How do I switch workspaces?",
    a: "Use the workspace dropdown in the top bar. Your last choice is remembered on this device so you are not asked again after every refresh.",
  },
  {
    id: "projects-vs-boards",
    q: "What is the difference between a project and a board?",
    a: "A project is the container for your delivery work. The board is the kanban view of tasks inside that project. Larger screens show full boards; smaller widths focus on chats and meetings.",
  },
  {
    id: "invite",
    q: "How do I invite someone?",
    a: "Open the workspace menu in the header. If you have permission, use Invite members and share the link or email flow your workspace uses.",
  },
  {
    id: "no-board-mobile",
    q: "Why can't I open the task board on my phone?",
    a: "Boards need horizontal space. Below desktop breakpoints the app highlights chats, meetings, and overview instead. Use a tablet landscape or desktop for boards.",
  },
  {
    id: "project-scope",
    q: "Why does chat ask me to select a project?",
    a: "Many modules are scoped to the project chosen in the header so threads and meetings stay tied to the right delivery context.",
  },
  {
    id: "meetings",
    q: "How do meetings work?",
    a: "Schedule or join from the Meetings module. Active sessions open in the meeting room; recent meetings may appear in the sidebar for that project.",
  },
  {
    id: "theme",
    q: "How do I change light/dark mode?",
    a: "Use the theme control in the top bar to pick Light, Dark, or System. Your preference follows your account session on this browser.",
  },
  {
    id: "logout",
    q: "Where do I sign out?",
    a: "Click your avatar in the top-right, then choose Logout. You can also manage profile and settings from that menu.",
  },
  {
    id: "support",
    q: "Something looks broken—what should I try?",
    a: "Reload the page, confirm you are wider than 360px, and ensure a workspace is selected. If a dropdown seems stuck, click outside it or press Escape.",
  },
];

export default function FaqPage() {
  const [openId, setOpenId] = useState(null);

  const toggle = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-6">
      <header className="space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">Help</p>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-2xl">
          Frequently asked questions
        </h1>
        <p className="text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
          Short answers about workspaces, projects, and using Collabrix on different screen sizes. Open one question at a time.
        </p>
      </header>

      <div className="divide-y divide-[var(--color-border)] overflow-hidden rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-card)] shadow-sm">
        {FAQS.map(({ id, q, a }) => {
          const expanded = openId === id;
          return (
            <div key={id} className="border-b border-[var(--color-border)] last:border-b-0">
              <button
                type="button"
                id={`faq-trigger-${id}`}
                aria-expanded={expanded}
                aria-controls={`faq-panel-${id}`}
                onClick={() => toggle(id)}
                className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[var(--color-surface-muted)]/50 sm:px-5 sm:py-4"
              >
                <span className="min-w-0 flex-1 text-[13px] font-semibold leading-snug text-[var(--color-text-primary)]">
                  {q}
                </span>
                <FaChevronDown
                  className={`mt-0.5 shrink-0 text-[11px] text-[var(--color-text-muted)] transition-transform duration-200 ${
                    expanded ? "rotate-180" : ""
                  }`}
                  aria-hidden
                />
              </button>
              {expanded ? (
                <div
                  id={`faq-panel-${id}`}
                  role="region"
                  aria-labelledby={`faq-trigger-${id}`}
                  className="border-t border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface-muted)_55%,transparent)] px-4 py-3 sm:px-5 sm:py-3.5"
                >
                  <p className="text-[13px] leading-relaxed text-[var(--color-text-secondary)] [overflow-wrap:anywhere]">
                    {a}
                  </p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
