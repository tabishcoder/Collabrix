export default function AuthInput({ error, ...props }) {
  return (
    <div className="w-full">
      <input
        {...props}
        className={`w-full px-5 py-3 bg-transparent border rounded-xl focus:outline-none
        ${error ? "border-red-500" : "border-[var(--color-border-strong)]"}
        focus:ring-2 focus:ring-[var(--color-primary)]`}
      />
      {error && (
        <p className="text-red-400 text-xs mt-1">{error}</p>
      )}
    </div>
  );
}