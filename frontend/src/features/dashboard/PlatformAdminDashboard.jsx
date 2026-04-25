import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaBuilding, FaFolder, FaUsers, FaCog } from "react-icons/fa";
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

export default function PlatformAdminDashboard() {
  const { activeSpace } = useSelector((s) => s.spaces);
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
          toast.error(err?.response?.data?.message || "Could not load platform overview");
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

  return (
    <div className="space-y-8">
      <header className="max-w-3xl space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">Platform</p>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-2xl">
          Administration
        </h1>
        <p className="text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
          Cross-workspace visibility for operators. Day-to-day delivery still happens inside each workspace.
        </p>
      </header>

      {!activeSpace && (
        <div className="max-w-3xl rounded-lg border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-[13px] text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/25 dark:text-amber-100/90">
          No workspace is selected. Use the workspace control in the header to open a tenant, or stay here to review
          aggregate metrics only.
        </div>
      )}

      <section>
        <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Usage</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-primary)]">
              <FaUsers className="text-[15px]" aria-hidden />
            </div>
            <p className="text-[11px] font-medium text-[var(--color-text-muted)]">Registered users</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--color-text-primary)]">
              {loading ? "…" : stats?.users ?? "—"}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-primary)]">
              <FaBuilding className="text-[15px]" aria-hidden />
            </div>
            <p className="text-[11px] font-medium text-[var(--color-text-muted)]">Workspaces</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--color-text-primary)]">
              {loading ? "…" : stats?.workspaces ?? "—"}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-primary)]">
              <FaFolder className="text-[15px]" aria-hidden />
            </div>
            <p className="text-[11px] font-medium text-[var(--color-text-muted)]">Projects</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--color-text-primary)]">
              {loading ? "…" : stats?.projects ?? "—"}
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          Workspaces
        </h2>
        <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm">
          <div className="max-h-[min(28rem,55vh)] overflow-auto">
            <table className="w-full min-w-[640px] text-left text-[13px]">
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
                  data?.workspaces?.map((w) => (
                    <tr key={w._id} className="bg-[var(--color-card)] text-[var(--color-text-secondary)]">
                      <td className="px-4 py-2.5 font-medium text-[var(--color-text-primary)]">{w.name}</td>
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

      <section className="max-w-3xl rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]">
            <FaCog className="text-[15px]" aria-hidden />
          </div>
          <div>
            <h2 className="text-[13px] font-semibold text-[var(--color-text-primary)]">Platform settings</h2>
            <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
              Tenant branding, feature flags, and billing integrations are typically configured outside this UI. Grant
              platform access by setting <code className="rounded bg-[var(--color-surface-muted)] px-1 py-0.5 text-[11px]">platformRole: &apos;admin&apos;</code> on a user in the database (or your internal admin tool).
            </p>
            <p className="mt-3 text-[12px] text-[var(--color-text-muted)]">
              Need the delivery experience?{" "}
              <Link to="/dashboard" className="font-medium text-[var(--color-primary)] hover:underline">
                Workspace home
              </Link>{" "}
              uses the same modules once a workspace is selected.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
