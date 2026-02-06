import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestResetPasswordApi } from "./authApi";
import toast from "react-hot-toast";

export default function ForgotPasswordRequest() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequest = async (e) => {
    e.preventDefault();

    if (!email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }

    try {
      setLoading(true);
      const res = await requestResetPasswordApi({ email });

      toast.success(res.data.message);

      // Pass both userId and email to VerifyOtp page
      navigate(
        `/verify-otp/${res.data.userId}?email=${encodeURIComponent(email)}`,
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to request OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="w-full max-w-md bg-[var(--color-card)] rounded-3xl shadow-2xl p-8 border border-white/5">
        <h2 className="text-2xl font-bold text-center mb-6">Forgot Password</h2>
        <p className="text-sm text-center mb-6">
          Enter your email to receive a password reset OTP
        </p>
        <form onSubmit={handleRequest} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full px-5 py-3 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[var(--color-primary)] text-white rounded-xl font-semibold hover:bg-[var(--color-highlight)] transition disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send OTP"}
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
