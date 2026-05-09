import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setActiveChat } from "../../features/chats/chatSlice";
import NewChatModal from "../../features/chats/NewChatModal";

function chatKind(chat) {
  return chat.kind || (chat.isGroup ? "group" : "direct");
}

function labelForChat(chat, selfId) {
  const kind = chatKind(chat);
  if (kind === "project") return "General";
  if (kind === "direct") {
    const other = chat.participants?.find((p) => String(p._id) !== String(selfId));
    return other?.name || "Direct";
  }
  return chat.name || "Group";
}

function initials(name) {
  if (!name || typeof name !== "string") return "?";
  const p = name.trim().split(/\s+/);
  if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function KindBadge({ kind }) {
  const k = kind === "project" ? "Channel" : kind === "group" ? "Group" : "DM";
  return (
    <span className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] ring-1 ring-[var(--color-border)]">
      {k}
    </span>
  );
}

export default function ChatsSubSidebar({ collapsed }) {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const activeProject = useSelector((s) => s.projects.activeProject);
  const chats = useSelector((s) => s.chats.chats);
  const listLoading = useSelector((s) => s.chats.listLoading);
  const listError = useSelector((s) => s.chats.listError);
  const activeChatId = useSelector((s) => s.chats.activeChatId);
  const [modalOpen, setModalOpen] = useState(false);

  const sorted = useMemo(() => [...chats], [chats]);

  return (
    <>
      <aside
        className={`
        flex h-full min-h-0 w-full shrink-0 flex-col
        border-r border-[var(--color-border-strong)]
        bg-[color-mix(in_oklab,var(--color-card)_97%,transparent)]
        transition-all duration-300 ease-out
        ${collapsed ? "lg:w-20" : "lg:w-[280px]"}
      `}
      >
        <div className="border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-card)_88%,transparent)] px-3 py-3">
          {collapsed ? (
            <div className="flex justify-center text-lg" aria-hidden>
              💬
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold tracking-tight text-[var(--color-text-primary)]">Messages</h3>
                <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-300">
                  {sorted.length}
                </span>
              </div>
              {activeProject?.name && (
                <p
                  className="mt-1 line-clamp-2 text-[11px] leading-snug text-[var(--color-text-muted)]"
                  title={activeProject.name}
                >
                  {activeProject.name}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2">
          {listError && !collapsed ? (
            <p className="mb-2 rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-2 text-[11px] text-red-600 dark:text-red-400">
              {listError}
            </p>
          ) : null}
          {!activeProject?._id ? (
            <p className="px-2 py-4 text-center text-[11px] text-[var(--color-text-muted)]">
              {collapsed ? "…" : "Select a project in the header to load conversations."}
            </p>
          ) : listLoading && sorted.length === 0 ? (
            <div className="space-y-2 px-1 py-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-xl bg-[var(--color-surface-hover)]"
                  aria-hidden
                />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <p className="px-2 py-6 text-center text-[11px] text-[var(--color-text-muted)]">
              {collapsed ? "—" : "No conversations yet. Start with General or New chat."}
            </p>
          ) : (
            <ul className="space-y-1">
              {!collapsed ? (
                <li className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  In this project
                </li>
              ) : null}
              {sorted.map((chat) => {
                const active = String(chat._id) === String(activeChatId);
                const unread = Number(chat.unreadCount) || 0;
                const kind = chatKind(chat);
                const other = kind === "direct" ? chat.participants?.find((p) => String(p._id) !== String(user?._id)) : null;
                const avatarName = kind === "project" ? "Gen" : kind === "group" ? chat.name : other?.name;

                return (
                  <li key={chat._id}>
                    <button
                      type="button"
                      onClick={() => dispatch(setActiveChat(chat._id))}
                      className={`
                        flex w-full gap-2 rounded-xl px-2 py-2 text-left transition-colors
                        ${
                          active
                            ? "bg-indigo-600/12 ring-1 ring-indigo-500/30"
                            : "hover:bg-[var(--color-surface-hover)]"
                        }
                      `}
                    >
                      {collapsed ? (
                        <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-700 dark:text-indigo-200">
                          {kind === "project" ? "#" : initials(avatarName || "?")}
                        </span>
                      ) : (
                        <>
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              kind === "project"
                                ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-200"
                                : kind === "group"
                                  ? "bg-violet-500/20 text-violet-800 dark:text-violet-200"
                                  : "bg-indigo-500/20 text-indigo-800 dark:text-indigo-200"
                            }`}
                          >
                            {kind === "project" ? "#" : initials(avatarName || "?")}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-1">
                              <span
                                className={`line-clamp-1 text-[13px] ${active ? "font-semibold text-[var(--color-text-primary)]" : "font-medium text-[var(--color-text-primary)]"}`}
                              >
                                {labelForChat(chat, user?._id)}
                              </span>
                              {unread > 0 ? (
                                <span className="shrink-0 rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                                  {unread > 99 ? "99+" : unread}
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-0.5 flex items-center gap-1.5">
                              <KindBadge kind={kind} />
                              {chat.lastActivityLabel ? (
                                <span className="text-[10px] text-[var(--color-text-muted)]">{chat.lastActivityLabel}</span>
                              ) : null}
                            </div>
                            {chat.lastMessageText ? (
                              <p className="mt-0.5 line-clamp-2 text-[11px] text-[var(--color-text-muted)]">
                                {chat.lastMessageText}
                              </p>
                            ) : (
                              <p className="mt-0.5 text-[11px] italic text-[var(--color-text-muted)]">No messages yet</p>
                            )}
                          </div>
                        </>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-card)_90%,transparent)] p-2">
          <button
            type="button"
            disabled={!activeProject?._id}
            onClick={() => setModalOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {collapsed ? "+" : <span>New chat</span>}
          </button>
        </div>
      </aside>

      <NewChatModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
