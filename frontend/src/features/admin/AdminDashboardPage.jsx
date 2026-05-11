import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaBuilding, FaCheck, FaFolder, FaTasks, FaUsers } from "react-icons/fa";
import toast from "react-hot-toast";
import { getAdminOverviewApi } from "./adminApi";

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return "—";
  }
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getAdminOverviewApi();
        if (!cancelled) setData(res.data);
      } catch (err) {
        if (!cancelled) {
          toast.error(err?.response?.data?.message || "Could not load overview");
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = data?.stats;

  const cards = [
    { label: "Registered users", value: stats?.users, icon: FaUsers },
    { label: "Workspaces", value: stats?.workspaces, icon: FaBuilding },
    { label: "Projects", value: stats?.projects, icon: FaFolder },
    { label: "Tasks", value: stats?.tasks, icon: FaTasks },
    { label: "Active users (7d)", value: stats?.activeUsers7d, icon: FaCheck },
    { label: "Deactivated accounts", value: stats?.inactiveUsers, icon: FaUsers },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">Overview</h1>
        <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
          System-wide metrics. Manage users in{" "}
          <Link to="/admin/users" className="font-medium text-[var(--color-primary)] hover:underline">
            Users
          </Link>
          .
        </p>
      </header>

      <section>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm"
            >
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-primary)]">
                <Icon className="text-[15px]" aria-hidden />
              </div>
              <p className="text-[11px] font-medium text-[var(--color-text-muted)]">{label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--color-text-primary)]">
                {loading ? "…" : value ?? "—"}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Recent workspaces
          </h2>
          <Link to="/admin/workspaces" className="text-[12px] font-medium text-[var(--color-primary)] hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm">
          <div className="max-h-[min(24rem,50vh)] overflow-auto">
            <table className="w-full min-w-[560px] text-left text-[13px]">
              <thead className="sticky top-0 z-[1] border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
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
                {!loading && (!data?.workspaces || data.workspaces.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                      No workspaces yet.
                    </td>
                  </tr>
                )}
                {!loading &&
                  data?.workspaces?.slice(0, 12).map((w) => (
                    <tr key={w._id} className="bg-[var(--color-card)] text-[var(--color-text-secondary)]">
                      <td className="px-4 py-2.5 font-medium text-[var(--color-text-primary)]">
                        <Link to={`/admin/workspaces/${w._id}`} className="hover:underline">
                          {w.name}
                        </Link>
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-2.5" title={w.owner?.email}>
                        {w.owner?.name || "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{w.memberCount}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{w.projectCount}</td>
                      <td className="px-4 py-2.5 text-[var(--color-text-muted)]">{formatDate(w.updatedAt)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
