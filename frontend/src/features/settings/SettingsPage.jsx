export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-soft)]">
        <h1 className="text-[15px] font-semibold text-[var(--color-text-primary)]">Settings</h1>
        <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
          Workspace and personal settings will live here.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-soft)]">
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          Coming soon: profile preferences, notifications, theme defaults, and security.
        </p>
      </div>
    </div>
  );
}

