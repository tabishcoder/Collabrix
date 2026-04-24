export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)] lg:flex-row">
      <div className="bg-gradient-to-tr from-indigo-600 to-violet-600 p-10 text-white lg:w-1/2">
        <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
        <p className="mt-4 text-indigo-100">{subtitle}</p>
      </div>

      <div className="flex items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}