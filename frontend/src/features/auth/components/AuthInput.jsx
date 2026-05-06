export default function AuthInput({ error, ...props }) {
  return (
    <div className="w-full">
      <input
        {...props}
        className={`app-control app-control--auth placeholder:text-[var(--color-text-muted)] ${error ? "app-control--invalid" : ""}`}
      />
      {error && (
        <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
