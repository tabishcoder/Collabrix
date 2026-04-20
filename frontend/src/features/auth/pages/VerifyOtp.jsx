import { useState } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { verifyOtpApi, resendOtpApi } from "../authApi";

import AuthLayout from "../components/AuthLayout";
import AuthButton from "../components/AuthButton";

export default function VerifyOtpPage() {
  const { userId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const email = params.get("email");
  const type = params.get("type"); // 🔥 IMPORTANT FIX

  const [otp, setOtp] = useState("");

  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // ================= VERIFY OTP =================
  const verify = async () => {
    if (otp.length !== 6) {
      toast.error("Enter 6-digit OTP");
      return;
    }

    try {
      setVerifyLoading(true);

      const res = await verifyOtpApi({ userId, otp });

      toast.success("Verified successfully 🎉");

      if (res.data.type === "password_reset") {
        navigate(`/reset-password?token=${res.data.resetToken}`);
      } else {
        navigate("/login");
      }

    } catch (err) {
      toast.error(err?.response?.data?.message || "Invalid OTP");
    } finally {
      setVerifyLoading(false);
    }
  };

  // ================= RESEND OTP =================
  const resend = async () => {
    if (!userId || !type) {
      toast.error("Invalid request context");
      return;
    }

    try {
      setResendLoading(true);

      await resendOtpApi({
        userId,
        type, // 🔥 FIX: critical for correct flow
      });

      toast.success("OTP resent successfully 📩");

    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to resend OTP"
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Verify OTP"
      subtitle="Enter the 6-digit code sent to your email"
    >
      <div className="space-y-4">

        {/* OTP INPUT */}
        <input
          value={otp}
          onChange={(e) =>
            setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          maxLength={6}
          className="w-full text-center tracking-[0.5em] text-xl px-5 py-4 border rounded-xl"
          placeholder="------"
        />

        {/* VERIFY BUTTON */}
        <AuthButton loading={verifyLoading} onClick={verify}>
          Verify OTP
        </AuthButton>

        {/* RESEND BUTTON */}
        <button
          onClick={resend}
          disabled={resendLoading}
          className="text-sm text-[var(--color-accent)] mt-3 disabled:opacity-50"
        >
          {resendLoading ? "Resending..." : "Resend OTP"}
        </button>

      </div>
 <p className="text-sm text-center mt-4 text-[var(--color-text-secondary)]">
          Back to{" "}
          <Link
            to="/login"
            className="text-[var(--color-accent)] font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>

    </AuthLayout>
  );
}