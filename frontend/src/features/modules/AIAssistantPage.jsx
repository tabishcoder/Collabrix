import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import ProjectScopedModule from "../project-scope/ProjectScopedModule";
import { queryWorkspaceAi } from "../ai/aiApi";

const STORAGE_PREFIX = "collabrix-ai-thread:";

const SUGGESTED = [
  "What tasks are pending this week?",
  "What moved on the board recently?",
  "What blockers exist for backend-related tasks?",
  "What was decided in meetings (see meeting recap for full summaries)?",
];

function loadThread(projectId) {
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + projectId);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveThread(projectId, messages) {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + projectId, JSON.stringify(messages.slice(-40)));
  } catch {
    /* ignore quota */
  }
}

export default function AIAssistantPage() {
  const activeProject = useSelector((s) => s.projects.activeProject);
  const projectId = activeProject?._id;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!projectId) return;
    setMessages(loadThread(projectId));
  }, [projectId]);

  useEffect(() => {
    const onClear = () => {
      if (!projectId) return;
      setMessages([]);
      sessionStorage.removeItem(STORAGE_PREFIX + projectId);
    };
    window.addEventListener("collabrix:clear-ai-history", onClear);
    return () => window.removeEventListener("collabrix:clear-ai-history", onClear);
  }, [projectId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = useCallback(
    async (text) => {
      const q = (text || "").trim();
      if (!q || !projectId) return;
      setInput("");
      const userMsg = { role: "user", content: q, at: Date.now() };
      setMessages((prev) => {
        const next = [...prev, userMsg];
        saveThread(projectId, next);
        return next;
      });
      setLoading(true);
      try {
        const data = await queryWorkspaceAi({ projectId, query: q });
        const assistantMsg = {
          role: "assistant",
          content: data.answer || "",
          used_context: data.used_context || [],
          at: Date.now(),
        };
        setMessages((prev) => {
          const next = [...prev, assistantMsg];
          saveThread(projectId, next);
          return next;
        });
      } catch (err) {
        const msg = err.response?.data?.message || err.message || "AI request failed";
        toast.error(msg);
        setMessages((prev) => {
          const next = [
            ...prev,
            { role: "assistant", content: `Error: ${msg}`, used_context: [], at: Date.now(), isError: true },
          ];
          saveThread(projectId, next);
          return next;
        });
      } finally {
        setLoading(false);
      }
    },
    [projectId],
  );

  const clearHistory = () => {
    if (!projectId) return;
    setMessages([]);
    sessionStorage.removeItem(STORAGE_PREFIX + projectId);
    toast.success("Cleared conversation for this project");
  };

  return (
    <ProjectScopedModule
      title="AI Knowledge Bot"
      description="Q&A over tasks, board activity, and ingested meeting notes. Official meeting summaries are generated automatically when a host ends a meeting (see Meeting recap on the ended room) — you do not need to re-summarize here."
    >
      <div className="flex max-h-[min(72vh,720px)] min-h-[420px] flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-card)]">
        <div className="flex shrink-0 flex-wrap gap-2 border-b border-[var(--color-border)] px-3 py-2 sm:px-4">
          {SUGGESTED.map((s) => (
            <button
              key={s}
              type="button"
              disabled={loading || !projectId}
              onClick={() => void send(s)}
              className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-left text-[11px] font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-text-primary)] disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4">
          {messages.length === 0 && (
            <p className="text-center text-[13px] text-[var(--color-text-muted)]">
              Ask about tasks, deadlines, and decisions. Meeting transcripts and AI recaps are saved when the host
              finishes a meeting; this bot searches that stored knowledge (it does not replace the meeting recap
              screen).
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={`${m.at}-${i}`}
              className={`flex flex-col gap-1.5 ${m.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[95%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed sm:max-w-[85%] ${
                  m.role === "user"
                    ? "bg-[var(--color-accent)] text-[var(--color-accent-fg)]"
                    : m.isError
                      ? "border border-red-500/40 bg-red-500/10 text-[var(--color-text-primary)]"
                      : "bg-[color-mix(in_oklab,var(--color-surface)_88%,transparent)] text-[var(--color-text-primary)]"
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
              {m.role === "assistant" && m.used_context?.length > 0 && (
                <div className="max-w-[95%] rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/80 px-2.5 py-2 text-[10px] text-[var(--color-text-muted)] sm:max-w-[85%]">
                  <span className="font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                    Sources
                  </span>
                  <ul className="mt-1 list-inside list-disc space-y-0.5">
                    {m.used_context.slice(0, 8).map((c) => (
                      <li key={c.id}>
                        <span className="text-[var(--color-text-secondary)]">{c.content_type}</span>
                        {c.title ? ` — ${c.title}` : ""}
                        {c.source_id ? ` (${String(c.source_id).slice(0, 12)}…)` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="text-[12px] text-[var(--color-text-muted)]">
              Retrieving context and generating an answer… (first query after startup can take longer while the model
              warms up.)
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          className="shrink-0 border-t border-[var(--color-border)] p-3 sm:p-4"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="sr-only" htmlFor="ai-workspace-query-input">
              Your question
            </label>
            <textarea
              id="ai-workspace-query-input"
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. What tasks are high priority?"
              className="min-h-[44px] flex-1 resize-y rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              disabled={loading || !projectId}
            />
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={clearHistory}
                className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-[12px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={loading || !input.trim() || !projectId}
                className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-[12px] font-semibold text-[var(--color-accent-fg)] disabled:opacity-50"
              >
                Ask
              </button>
            </div>
          </div>
        </form>
      </div>
    </ProjectScopedModule>
  );
}
