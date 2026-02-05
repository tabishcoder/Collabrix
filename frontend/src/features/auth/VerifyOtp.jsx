import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { verifyOtpApi, resendOtpApi } from "./authApi";
import toast from "react-hot-toast";

export default function VerifyOtp() {
  const { userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const email = params.get("email"); // needed for resend OTP

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      setLoading(true);
      const res = await verifyOtpApi({ userId, otp });

      toast.success(res.data.message);

      if (res.data.type === "password_reset") {
        // navigate to reset password page with resetToken
        navigate(`/reset-password?token=${res.data.resetToken}`);
      } else {
        // email verification
        navigate("/login");
      }
    } catch (err) {
      console.error(err.response?.data);
      toast.error(err.response?.data?.message || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("Cannot resend OTP. Email missing.");
      return;
    }

    try {
      await resendOtpApi({ email });
      toast.success("OTP resent to your email");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend OTP");
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[var(--color-bg)]">
      {/* Left Branding Section */}
      <div className="lg:w-1/2 flex flex-col justify-center bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-highlight)] text-[var(--color-text-primary)] px-10 py-16">
        <h1 className="text-4xl font-extrabold mb-4">Verify Your Email</h1>
        <p className="text-lg text-[var(--color-text-secondary)] max-w-md">
          We’ve sent a 6-digit verification code to your email address. Please
          enter it to continue.
        </p>
        <p className="mt-6 text-sm text-[var(--color-text-secondary)]">
          Didn’t receive the code? You can resend it anytime.
        </p>
      </div>

      {/* OTP Form Section */}
      <div className="lg:w-1/2 flex items-center justify-center bg-[var(--color-bg)] px-6 py-16">
        <div className="w-full max-w-md bg-[var(--color-card)] rounded-3xl shadow-2xl p-10 border border-white/5 text-center">
          <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-3">
            Enter OTP
          </h2>

          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            Enter the 6-digit code sent to your email
          </p>

          <input
            type="text"
            maxLength={6}
            placeholder="••••••"
            className="w-full mb-5 px-5 py-4 bg-transparent border border-white/10 rounded-xl text-center tracking-[0.4em] text-2xl font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)]"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          />

          <button
            onClick={handleVerify}
            disabled={loading}
            className="w-full bg-[var(--color-primary)] text-white py-3 rounded-xl font-semibold hover:bg-[var(--color-highlight)] transition disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>

          <button
            onClick={handleResend}
            className="mt-5 text-sm font-medium text-[var(--color-accent)] hover:underline"
          >
            Resend OTP
          </button>
        </div>
      </div>
    </div>
  );
}
