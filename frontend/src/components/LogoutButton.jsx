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
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-md transition"
      >
        <FaSignOutAlt size={14} /> Logout
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
    >
      <FaSignOutAlt />
      Logout
    </button>
  );
}
