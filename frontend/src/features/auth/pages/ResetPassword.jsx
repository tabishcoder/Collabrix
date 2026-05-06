import { useForm } from "react-hook-form";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import AuthInput from "../components/AuthInput";
import AuthButton from "../components/AuthButton";
import AuthLayout from "../components/AuthLayout";
import { resetPasswordApi } from "../authApi";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const token = params.get("token");

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm();

  const onSubmit = async (data) => {
    if (!token) {
      toast.error("Invalid reset link");
      return;
    }

    try {
      await resetPasswordApi({
        resetToken: token,
        newPassword: data.password,
      });

      toast.success("Password reset successful 🎉");
      navigate("/login");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Reset failed");
    }
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Create a new secure password"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        <AuthInput
          type="password"
          placeholder="New password"
          {...register("password", {
            required: "Password required",
            minLength: { value: 8, message: "Min 8 characters" },
          })}
          error={errors.password?.message}
        />

        <AuthButton loading={isSubmitting}>
          Reset Password
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