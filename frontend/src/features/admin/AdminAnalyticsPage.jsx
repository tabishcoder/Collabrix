import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import toast from "react-hot-toast";
import { getAdminAnalyticsApi } from "./adminApi";

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getAdminAnalyticsApi({ days: 30 });
        if (!cancelled) setData(res.data);
      } catch (err) {
        if (!cancelled) {
          toast.error(err?.response?.data?.message || "Failed to load analytics");
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

  const merged =
    data &&
    (() => {
      const u = data.usersCreated || [];
      const t = data.tasksCreated || [];
      const w = data.workspacesCreated || [];
      const n = Math.max(u.length, t.length, w.length);
      const out = [];
      for (let i = 0; i < n; i += 1) {
        out.push({
          date: u[i]?.date || t[i]?.date || w[i]?.date,
          users: u[i]?.count ?? 0,
          tasks: t[i]?.count ?? 0,
          workspaces: w[i]?.count ?? 0,
        });
      }
      return out.filter((row) => row.date);
    })();

  const top = data?.topWorkspacesByTasks || [];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Analytics</h1>
        <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
          Last 30 days — users, tasks, and workspaces created per day.
        </p>
      </header>

      {loading && <p className="text-[13px] text-[var(--color-text-muted)]">Loading…</p>}

      {!loading && merged && merged.length > 0 && (
        <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm">
          <h2 className="mb-4 text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Activity trends
          </h2>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={merged} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--color-text-muted)" />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} stroke="var(--color-text-muted)" />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="users" name="Users" stroke="#6366f1" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="tasks" name="Tasks" stroke="#14b8a6" strokeWidth={2} dot={false} />
                <Line
                  type="monotone"
                  dataKey="workspaces"
                  name="Workspaces"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {!loading && merged && merged.length === 0 && (
        <p className="text-[13px] text-[var(--color-text-muted)]">No activity in the selected window yet.</p>
      )}

      {!loading && top.length > 0 && (
        <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm">
          <h2 className="mb-4 text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Top workspaces by tasks
          </h2>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} stroke="var(--color-text-muted)" />
                <YAxis
                  type="category"
                  dataKey="workspaceName"
                  width={120}
                  tick={{ fontSize: 10 }}
                  stroke="var(--color-text-muted)"
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="taskCount" name="Tasks" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  );
}
