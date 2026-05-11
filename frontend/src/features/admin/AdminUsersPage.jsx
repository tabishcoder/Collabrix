import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getAdminUsersApi, patchAdminUserApi } from "./adminApi";

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return "—";
  }
}

export default function AdminUsersPage() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState(null);
  const [actingId, setActingId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [debounced]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminUsersApi({ q: debounced || undefined, page, limit: 15 });
      setPayload(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load users");
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [debounced, page]);

  useEffect(() => {
    load();
  }, [load]);

  const patchUser = async (id, body) => {
    setActingId(id);
    try {
      await patchAdminUserApi(id, body);
      toast.success("User updated");
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Update failed");
    } finally {
      setActingId(null);
    }
  };

  const users = payload?.users || [];
  const totalPages = payload?.totalPages || 1;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Users</h1>
        <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
          Platform accounts. Workspace ownership is managed per workspace, not here.
        </p>
      </header>

      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name or email…"
        className="w-full max-w-md rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-[13px] text-[var(--color-text-primary)] outline-none ring-[var(--color-primary)] focus:ring-2"
      />

      <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              <tr>
                <th className="px-3 py-2.5">User</th>
                <th className="px-3 py-2.5">Role</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5 text-right">Owned WS</th>
                <th className="px-3 py-2.5 text-right">Member WS</th>
                <th className="px-3 py-2.5">Last login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-[var(--color-text-muted)]">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading &&
                users.map((u) => (
                  <tr key={u._id} className="text-[var(--color-text-secondary)]">
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-[var(--color-text-primary)]">{u.name}</div>
                      <div className="text-[12px] text-[var(--color-text-muted)]">{u.email}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <select
                        value={u.role}
                        disabled={actingId === u._id}
                        onChange={(e) => patchUser(u._id, { role: e.target.value })}
                        className="rounded border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-1 text-[12px]"
                      >
                        <option value="member">member</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="px-3 py-2.5">
                      <label className="inline-flex cursor-pointer items-center gap-2 text-[12px]">
                        <input
                          type="checkbox"
                          checked={u.isActive !== false}
                          disabled={actingId === u._id}
                          onChange={(e) => patchUser(u._id, { isActive: e.target.checked })}
                        />
                        {u.isActive === false ? "inactive" : "active"}
                      </label>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{u.ownedWorkspaceCount ?? 0}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{u.workspaceMembershipCount ?? 0}</td>
                    <td className="px-3 py-2.5 text-[var(--color-text-muted)]">{formatDate(u.lastLoginAt)}</td>
                  </tr>
                ))}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-[var(--color-text-muted)]">
                    No users match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-[12px]">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded border border-[var(--color-border)] px-3 py-1 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-[var(--color-text-muted)]">
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border border-[var(--color-border)] px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
