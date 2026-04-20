export default function AuthButton({ loading, children, ...props }) {
  return (
    <button
      {...props}
      disabled={loading}
      className="w-full bg-[var(--color-primary)] text-white py-3 rounded-xl font-semibold disabled:opacity-50"
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}