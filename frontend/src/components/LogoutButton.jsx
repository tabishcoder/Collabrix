import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../features/auth/authSlice";
import { FaSignOutAlt } from "react-icons/fa";
import toast from "react-hot-toast";

export default function LogoutButton({ variant = "default" }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      toast.success("Logged out successfully");
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(err || "Logout failed");
    }
  };

  if (variant === "dropdown") {
    return (
      <button
        type="button"
        onClick={handleLogout}
        title="Log out"
        className="flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-card)] px-2 text-[13px] font-medium text-[var(--color-text-secondary)] shadow-sm transition-colors duration-150 hover:border-red-500/25 hover:bg-red-500/[0.06] hover:text-red-700 dark:hover:text-red-300"
      >
        <FaSignOutAlt className="text-[13px] opacity-90" aria-hidden />
        <span className="hidden sm:inline">Log out</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex w-full items-center justify-center gap-2 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-card)] px-4 py-2.5 text-[13px] font-medium text-[var(--color-text-secondary)] shadow-sm transition-colors duration-150 hover:border-red-500/25 hover:bg-red-500/[0.06] hover:text-red-700 dark:hover:text-red-300"
    >
      <FaSignOutAlt className="text-sm" aria-hidden />
      Log out
    </button>
  );
}
