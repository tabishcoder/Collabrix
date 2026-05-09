import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  pushNotification,
} from "../features/notifications/notificationsSlice";
import { getSocket } from "../services/socket";

export default function NotificationsBell() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { items, unread, loading } = useSelector((s) => s.notifications);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return undefined;
    dispatch(fetchNotifications());
    const socket = getSocket();
    const handler = (payload) => {
      dispatch(pushNotification(payload));
    };
    socket.on("notification", handler);
    return () => socket.off("notification", handler);
  }, [dispatch, user]);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-md p-2 text-[var(--color-text-secondary)] transition-colors duration-150 hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
        title="Notifications"
        aria-expanded={open}
      >
        <FaBell size={15} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[var(--color-danger)] px-0.5 text-[9px] font-bold text-white ring-2 ring-[var(--color-card)]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            className="fixed inset-0 z-[190] cursor-default bg-transparent"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-[210] mt-2 w-[min(calc(100vw-2rem),22rem)] overflow-hidden rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-dropdown-bg)] shadow-xl ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-2">
              <span className="text-[12px] font-semibold text-[var(--color-text-primary)]">Notifications</span>
              <button
                type="button"
                className="text-[11px] font-medium text-[var(--color-primary)] hover:underline disabled:opacity-40"
                disabled={!unread}
                onClick={async () => {
                  await dispatch(markAllNotificationsRead()).unwrap().catch(() => {});
                }}
              >
                Mark all read
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {loading && <p className="p-3 text-[12px] text-[var(--color-text-muted)]">Loading…</p>}
              {!loading && items.length === 0 && (
                <p className="p-4 text-center text-[12px] text-[var(--color-text-muted)]">You&apos;re all caught up.</p>
              )}
              <ul>
                {items.map((n) => (
                  <li key={n._id} className="border-b border-[var(--color-border)] last:border-0">
                    <button
                      type="button"
                      className={`flex w-full flex-col gap-0.5 px-3 py-2.5 text-left text-[12px] transition-colors hover:bg-[var(--color-surface-hover)] ${
                        n.read ? "opacity-75" : "bg-[color-mix(in_oklab,var(--color-primary)_6%,transparent)]"
                      }`}
                      onClick={async () => {
                        if (!n.read) {
                          await dispatch(markNotificationRead(n._id)).unwrap().catch(() => {});
                        }
                        setOpen(false);
                        if (n.link) navigate(n.link);
                      }}
                    >
                      <span className="font-semibold text-[var(--color-text-primary)]">{n.title}</span>
                      {n.body && <span className="text-[11px] text-[var(--color-text-secondary)]">{n.body}</span>}
                      <span className="text-[10px] text-[var(--color-text-muted)]">
                        {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t border-[var(--color-border)] px-3 py-2 text-center">
              <Link to="/welcome" className="text-[11px] font-medium text-[var(--color-primary)] hover:underline" onClick={() => setOpen(false)}>
                Workspace home
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
