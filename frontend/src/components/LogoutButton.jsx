import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../features/auth/authSlice";
import toast from "react-hot-toast";

export default function LogoutButton() {
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

  return (
    <button
      onClick={handleLogout}
      className="w-full px-4 py-2 rounded-md text-sm font-medium
        bg-[var(--color-primary)] hover:opacity-90 transition"
    >
      Logout
    </button>
  );
}
