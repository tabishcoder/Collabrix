import { useForm } from "react-hook-form";
import AuthInput from "../components/AuthInput";
import AuthButton from "../components/AuthButton";
import AuthLayout from "../components/AuthLayout";
import { requestResetPasswordApi } from "../authApi";
import toast from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm();

 const onSubmit = async (data) => {
  try {
    const res = await requestResetPasswordApi(data);

    toast.success(res.data.message);

    // ❗ IMPORTANT: only navigate if userId exists
    if (res.data.userId) {
      navigate(
        `/verify-otp/${res.data.userId}?email=${data.email}&type=password_reset`
      );
    }

    // else: do nothing (security-safe silent response)

  } catch (err) {
    toast.error(
      err?.response?.data?.message || "Request failed"
    );
  }
};

  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="We will send a verification code to your email"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        <AuthInput
          placeholder="Email"
          {...register("email", {
            required: "Email required",
            pattern: {
              value: /^\S+@\S+$/i,
              message: "Invalid email",
            },
          })}
          error={errors.email?.message}
        />

        <AuthButton loading={isSubmitting}>
          Send OTP
        </AuthButton>

        <p className="text-sm text-center mt-4 text-[var(--color-text-secondary)]">
          Back to{" "}
          <Link
            to="/login"
            className="text-[var(--color-accent)] font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}