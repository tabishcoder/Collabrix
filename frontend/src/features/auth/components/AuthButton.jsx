export default function AuthButton({ loading, children, className, ...props }) {
  return (
    <button
      {...props}
      disabled={loading}
      className={["app-btn-auth-primary", className].filter(Boolean).join(" ")}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}
