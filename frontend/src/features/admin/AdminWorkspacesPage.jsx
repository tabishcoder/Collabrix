import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { getAdminWorkspacesApi } from "./adminApi";

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return "—";
  }
}

export default function AdminWorkspacesPage() {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getAdminWorkspacesApi();
        if (!cancelled) setList(res.data.workspaces || []);
      } catch (err) {
        if (!cancelled) {
          toast.error(err?.response?.data?.message || "Failed to load workspaces");
          setList([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Workspaces</h1>
        <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">All tenants with member and project counts.</p>
      </header>

      <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Owner</th>
                <th className="px-4 py-2.5 text-right">Members</th>
                <th className="px-4 py-2.5 text-right">Projects</th>
                <th className="px-4 py-2.5">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading &&
                list.map((w) => (
                  <tr key={w._id} className="text-[var(--color-text-secondary)]">
                    <td className="px-4 py-2.5 font-medium text-[var(--color-text-primary)]">
                      <Link to={`/admin/workspaces/${w._id}`} className="hover:underline">
                        {w.name}
                      </Link>
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-2.5" title={w.owner?.email}>
                      {w.owner?.name || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{w.memberCount}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{w.projectCount}</td>
                    <td className="px-4 py-2.5 text-[var(--color-text-muted)]">{formatDate(w.updatedAt)}</td>
                  </tr>
                ))}
              {!loading && list.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                    No workspaces.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
