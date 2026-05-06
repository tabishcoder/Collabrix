import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "../auth.validation";
import { useDispatch } from "react-redux";
import { register } from "../authSlice";
import { useNavigate, useSearchParams, Link } from "react-router-dom";

import toast from "react-hot-toast";

import AuthInput from "../components/AuthInput";
import AuthButton from "../components/AuthButton";
import AuthLayout from "../components/AuthLayout";

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "";

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    try {
      const res = await dispatch(register(data)).unwrap();
      toast.success("OTP sent to email");
      const redirectParam = redirect ? `&redirect=${encodeURIComponent(redirect)}` : "";
      navigate(`/verify-otp/${res.userId}?type=email_verification${redirectParam}`);
    } catch (err) {
      toast.error(err || "Registration failed");
    }
  };

  return (
    <AuthLayout
      title="Join Collabrix"
      subtitle="AI-powered collaboration for modern teams"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <AuthInput
          placeholder="Full name"
          {...formRegister("name")}
          error={errors.name?.message}
        />

        <AuthInput
          placeholder="Email"
          {...formRegister("email")}
          error={errors.email?.message}
        />

        <AuthInput
          type="password"
          placeholder="Password"
          {...formRegister("password")}
          error={errors.password?.message}
        />

        <AuthButton loading={isSubmitting}>Create Account</AuthButton>
        <p className="text-sm text-center mt-4 text-[var(--color-text-secondary)]">
          Already have an account?{" "}
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
