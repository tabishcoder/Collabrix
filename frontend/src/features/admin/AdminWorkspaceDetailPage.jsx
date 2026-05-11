import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getAdminWorkspaceApi } from "./adminApi";

export default function AdminWorkspaceDetailPage() {
  const { workspaceId } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!workspaceId) return;
      setLoading(true);
      try {
        const res = await getAdminWorkspaceApi(workspaceId);
        if (!cancelled) setData(res.data);
      } catch (err) {
        if (!cancelled) {
          toast.error(err?.response?.data?.message || "Failed to load workspace");
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  const ws = data?.workspace;
  const projects = data?.projects || [];

  return (
    <div className="space-y-6">
      <div className="text-[12px] text-[var(--color-text-muted)]">
        <Link to="/admin/workspaces" className="font-medium text-[var(--color-primary)] hover:underline">
          ← Workspaces
        </Link>
      </div>

      {loading && <p className="text-[13px] text-[var(--color-text-muted)]">Loading…</p>}

      {!loading && ws && (
        <>
          <header>
            <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">{ws.name}</h1>
            <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
              Owner:{" "}
              <span className="font-medium text-[var(--color-text-primary)]">
                {ws.owner?.name || "—"} ({ws.owner?.email || "—"})
              </span>
            </p>
          </header>

          <section>
            <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              Members ({ws.members?.length || 0})
            </h2>
            <ul className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] divide-y divide-[var(--color-border)] text-[13px]">
              {(ws.members || []).map((m) => (
                <li
                  key={m.user?._id ? String(m.user._id) : `${m.role}-${m.joinedAt}`}
                  className="flex justify-between gap-2 px-3 py-2"
                >
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {m.user?.name || "—"}{" "}
                    <span className="font-normal text-[var(--color-text-muted)]">{m.user?.email}</span>
                  </span>
                  <span className="shrink-0 text-[var(--color-text-secondary)]">{m.role}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              Projects ({projects.length})
            </h2>
            <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]">
              <table className="w-full text-left text-[13px]">
                <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[11px] font-semibold uppercase text-[var(--color-text-muted)]">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2 text-right">Members</th>
                    <th className="px-3 py-2 text-right">Tasks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {projects.map((p) => (
                    <tr key={p._id}>
                      <td className="px-3 py-2 font-medium text-[var(--color-text-primary)]">{p.name}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-[var(--color-text-secondary)]">
                        {p.memberCount}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-[var(--color-text-secondary)]">
                        {p.taskCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
