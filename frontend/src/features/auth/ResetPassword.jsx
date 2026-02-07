import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { resetPasswordApi } from "./authApi";
import toast from "react-hot-toast";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get resetToken from query params
  const params = new URLSearchParams(location.search);
  const resetToken = params.get("token");

  const handleReset = async (e) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (!resetToken) {
      toast.error("Reset token missing. Please request OTP again.");
      return;
    }

    try {
      setLoading(true);
      await resetPasswordApi({ resetToken, newPassword });
      toast.success("Password reset successful 🎉");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="w-full max-w-md bg-[var(--color-card)] rounded-3xl shadow-2xl p-8 border border-white/5">
        <h2 className="text-2xl font-bold text-center mb-6">
          Set New Password
        </h2>
        <form onSubmit={handleReset} className="space-y-4">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            className="w-full px-5 py-3 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
          <button
            type="submit"
            disabled={loading || !resetToken}
            className="w-full py-3 bg-[var(--color-primary)] text-white rounded-xl font-semibold hover:bg-[var(--color-highlight)] transition disabled:opacity-50"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>

          <button
            onClick={() => navigate("/login")}
            className="mt-3 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:underline"
          >
            ← Back to Login
          </button>
          
        </form>
      </div>
    </div>
  );
}
