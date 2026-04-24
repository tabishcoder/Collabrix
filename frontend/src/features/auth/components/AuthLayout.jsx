export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)] lg:flex-row">
      <div className="relative overflow-hidden bg-gradient-to-tr from-indigo-600 to-violet-600 p-10 text-white lg:w-1/2">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-cyan-400/15 blur-3xl"
          aria-hidden
        />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-100/90">Collabrix</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">{title}</h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-indigo-100">{subtitle}</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 sm:p-10 lg:w-1/2">
        <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--color-border-strong)] bg-[var(--color-card)] p-8 shadow-[var(--shadow-soft)] sm:p-10">
          {children}
        </div>
      </div>
    </div>
  );
}
