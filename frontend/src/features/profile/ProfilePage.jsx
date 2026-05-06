import { useSelector } from "react-redux";

export default function ProfilePage() {
  const { user } = useSelector((s) => s.auth);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-soft)]">
        <h1 className="text-[15px] font-semibold text-[var(--color-text-primary)]">Profile</h1>
        <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
          Your account details.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-soft)]">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">Name</div>
            <div className="mt-1 text-[14px] font-medium text-[var(--color-text-primary)]">{user?.name || "—"}</div>
          </div>
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">Email</div>
            <div className="mt-1 text-[14px] font-medium text-[var(--color-text-primary)]">{user?.email || "—"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

