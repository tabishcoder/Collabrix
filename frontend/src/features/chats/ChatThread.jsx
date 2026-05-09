import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { getSocket } from "../../services/socket";
import { computeReceiptStatusClient } from "../../utils/chatReceipts";
import {
  deleteChat,
  deleteMessage,
  fetchChatMessages,
  markChatRead,
  sendChatMessage,
} from "./chatSlice";
import MessageReceiptTicks from "./MessageReceiptTicks";
import ChatVoiceBar from "./ChatVoiceBar";

function chatHeading(chat, selfId) {
  if (!chat) return "";
  const kind = chat.kind || (chat.isGroup ? "group" : "direct");
  if (kind === "project") return "General";
  if (kind === "direct") {
    const other = chat.participants?.find((p) => String(p._id) !== String(selfId));
    return other?.name || "Direct message";
  }
  return chat.name || "Group";
}

export default function ChatThread() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const activeChatId = useSelector((s) => s.chats.activeChatId);
  const chats = useSelector((s) => s.chats.chats);
  const bucket = useSelector((s) =>
    activeChatId ? s.chats.messagesByChatId[String(activeChatId)] : null,
  );
  const sendError = useSelector((s) => s.chats.sendError);

  const [text, setText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollRef = useRef(null);
  const loadingOlder = useRef(false);
  const deliveredAcked = useRef(new Set());

  const activeChat = chats.find((c) => String(c._id) === String(activeChatId));
  const items = bucket?.items ?? [];
  const readReceipts = bucket?.readReceipts ?? {};
  const hasMore = bucket?.hasMore ?? false;
  const loading = bucket?.loading ?? false;

  const participantIds = (activeChat?.participants || []).map((p) => String(p._id || p));

  useEffect(() => {
    deliveredAcked.current = new Set();
  }, [activeChatId]);

  useEffect(() => {
    if (!activeChatId) return;
    const socket = getSocket();
    socket.emit("join-chat", activeChatId);
    return () => {
      socket.emit("leave-chat", activeChatId);
    };
  }, [activeChatId]);

  useEffect(() => {
    if (!activeChatId) return;
    dispatch(fetchChatMessages({ chatId: activeChatId }));
    dispatch(markChatRead(activeChatId));
  }, [dispatch, activeChatId]);

  useEffect(() => {
    if (sendError) toast.error(sendError);
  }, [sendError]);

  useEffect(() => {
    if (!activeChatId || !user?._id || !items.length) return;
    const mine = String(user._id);
    const toAck = [];
    for (const m of items) {
      const sid = String(m.sender?._id || m.sender);
      if (sid === mine) continue;
      if (!m._id || String(m._id).startsWith("temp-")) continue;
      if (m.deletedAt) continue;
      if (deliveredAcked.current.has(String(m._id))) continue;
      toAck.push(String(m._id));
      deliveredAcked.current.add(String(m._id));
    }
    if (!toAck.length) return;
    const t = setTimeout(() => {
      getSocket().emit("chat:ack-delivered", { chatId: activeChatId, messageIds: toAck.slice(0, 40) });
    }, 350);
    return () => clearTimeout(t);
  }, [activeChatId, items, user?._id]);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    if (!activeChatId || loading) return;
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
    if (nearBottom || items.length <= 12) scrollToBottom();
  }, [activeChatId, items.length, loading, scrollToBottom]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el || !activeChatId || !hasMore || loadingOlder.current || loading) return;
    if (el.scrollTop > 80) return;
    const oldest = items[0];
    if (!oldest?._id || String(oldest._id).startsWith("temp-")) return;
    loadingOlder.current = true;
    const prevHeight = el.scrollHeight;
    dispatch(fetchChatMessages({ chatId: activeChatId, before: oldest._id }))
      .unwrap()
      .finally(() => {
        loadingOlder.current = false;
        requestAnimationFrame(() => {
          const next = scrollRef.current;
          if (next) next.scrollTop = next.scrollHeight - prevHeight;
        });
      });
  };

  const onSend = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !activeChatId || !user) return;
    const clientMessageId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;
    setText("");
    dispatch(
      sendChatMessage({
        chatId: activeChatId,
        content: trimmed,
        clientMessageId,
        sender: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar },
      }),
    );
  };

  const onDeleteMessage = async (messageId) => {
    if (!activeChatId || !window.confirm("Remove this message for everyone?")) return;
    try {
      await dispatch(deleteMessage({ chatId: activeChatId, messageId })).unwrap();
      toast.success("Message deleted");
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Could not delete");
    }
  };

  const onDeleteChat = async () => {
    if (!activeChatId) return;
    const kind = activeChat?.kind || (activeChat?.isGroup ? "group" : "direct");
    if (kind === "project") {
      toast.error("The project channel cannot be deleted.");
      return;
    }
    if (!window.confirm("Delete this conversation for you and other members? This cannot be undone.")) return;
    try {
      await dispatch(deleteChat(activeChatId)).unwrap();
      toast.success("Chat deleted");
      setMenuOpen(false);
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Could not delete chat");
    }
  };

  if (!activeChatId) {
    return (
      <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-card)]/50">
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
          <p className="max-w-sm text-[13px] text-[var(--color-text-muted)]">
            Select a conversation from the left, or start a new one.
          </p>
        </div>
      </div>
    );
  }

  const kind = activeChat?.kind || (activeChat?.isGroup ? "group" : "direct");
  const showEmptyState = !loading && items.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-soft)]">
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-[var(--color-border)] px-3 py-2.5 sm:px-4">
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-semibold text-[var(--color-text-primary)]">
            {chatHeading(activeChat, user?._id)}
          </h2>
          {kind === "project" && (
            <p className="text-[11px] text-[var(--color-text-muted)]">Everyone on this project</p>
          )}
        </div>
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="rounded-lg px-2 py-1.5 text-lg leading-none text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
            aria-expanded={menuOpen}
            aria-haspopup="true"
            aria-label="Chat options"
          >
            ⋮
          </button>
          {menuOpen ? (
            <>
              <button
                type="button"
                className="fixed inset-0 z-10 cursor-default bg-transparent"
                aria-hidden
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-card)] py-1 shadow-lg">
                {kind !== "project" ? (
                  <button
                    type="button"
                    onClick={onDeleteChat}
                    className="w-full px-3 py-2 text-left text-[13px] text-red-600 hover:bg-red-500/10 dark:text-red-400"
                  >
                    Delete conversation
                  </button>
                ) : (
                  <p className="px-3 py-2 text-[12px] text-[var(--color-text-muted)]">Project channel is permanent.</p>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>

      <ChatVoiceBar chatId={activeChatId} />

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-3 py-2 sm:px-4"
      >
        {loading && items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" aria-hidden />
            <p className="text-[13px] text-[var(--color-text-muted)]">Loading messages…</p>
          </div>
        ) : null}

        {showEmptyState ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-12 text-center">
            <div className="rounded-full bg-[var(--color-surface-hover)] px-4 py-2 text-2xl" aria-hidden>
              💬
            </div>
            <div className="max-w-xs space-y-1">
              <p className="text-[14px] font-medium text-[var(--color-text-primary)]">No messages yet</p>
              <p className="text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                Start the thread below. Sent messages show one tick (red), two ticks when delivered (amber), and
                green double ticks when read.
              </p>
            </div>
          </div>
        ) : null}

        {items.length > 0
          ? items.map((m) => {
              const mine = String(m.sender?._id || m.sender) === String(user?._id);
              const deleted = Boolean(m.deletedAt || m.isDeleted);
              const receipt =
                mine && !deleted
                  ? m.receiptStatus ||
                    computeReceiptStatusClient(m, participantIds, readReceipts, user?._id)
                  : null;
              return (
                <div key={m._id} className={`group/msg flex shrink-0 ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`relative max-w-[88%] rounded-2xl py-2 text-[13px] leading-relaxed sm:max-w-[72%] ${
                      mine
                        ? "bg-indigo-600 pl-3 pr-7 text-white"
                        : "bg-[color-mix(in_oklab,var(--color-surface-hover)_88%,transparent)] px-3 text-[var(--color-text-primary)]"
                    }`}
                  >
                    {!mine && !deleted && (
                      <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                        {m.sender?.name || "Member"}
                      </p>
                    )}
                    {deleted ? (
                      <p className={`italic ${mine ? "text-indigo-100/80" : "text-[var(--color-text-muted)]"}`}>
                        This message was deleted
                      </p>
                    ) : (
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    )}
                    <div
                      className={`mt-1 flex flex-wrap items-center justify-end gap-x-2 gap-y-0.5 text-[10px] ${
                        mine ? "text-indigo-100/90" : "text-[var(--color-text-muted)]"
                      }`}
                    >
                      <span>
                        {m.createdAt
                          ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : ""}
                      </span>
                      {mine && receipt && !deleted ? <MessageReceiptTicks status={receipt} /> : null}
                    </div>
                    {mine && !deleted && !String(m._id).startsWith("temp-") ? (
                      <button
                        type="button"
                        onClick={() => onDeleteMessage(m._id)}
                        className="absolute right-1 top-1 rounded p-1 text-[11px] text-white/70 opacity-0 transition-opacity hover:bg-white/10 hover:text-white group-hover/msg:opacity-100"
                        title="Delete message"
                      >
                        ✕
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })
          : null}
      </div>

      <form
        onSubmit={onSend}
        className="shrink-0 border-t border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-card)_92%,transparent)] p-2 sm:p-3"
      >
        <div className="flex gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend(e);
              }
            }}
            rows={2}
            placeholder="Write a message…"
            className="max-h-36 min-h-[4.5rem] flex-1 resize-y rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none ring-indigo-500/25 focus:ring-2"
          />
          <button
            type="submit"
            className="self-end rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Send
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-[var(--color-text-muted)]">Enter to send · Shift+Enter newline</p>
      </form>
    </div>
  );
}
