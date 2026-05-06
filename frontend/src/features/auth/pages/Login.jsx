import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "../auth.validation";
import { useDispatch } from "react-redux";
import { login, getMe } from "../authSlice";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import toast from "react-hot-toast";

import AuthInput from "../components/AuthInput";
import AuthButton from "../components/AuthButton";
import AuthLayout from "../components/AuthLayout";

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      await dispatch(login(data)).unwrap();
      await dispatch(getMe()).unwrap();

      toast.success("Welcome back!");
      navigate(redirect, { replace: true });
    } catch (err) {
      toast.error(err || "Login failed");
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to continue to Collabrix"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        <AuthInput
          placeholder="Email"
          {...register("email")}
          error={errors.email?.message}
        />

        <AuthInput
          type="password"
          placeholder="Password"
          {...register("password")}
          error={errors.password?.message}
        />

        <AuthButton loading={isSubmitting}>
          Sign In
        </AuthButton>

        <div className="text-sm text-center mt-4">
          <Link
            to="/forgot-password"
            className="text-[var(--color-accent)] hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <p className="text-[var(--color-text-secondary)]">
    Don’t have an account?{" "}
    <Link
      to="/register"
      className="text-[var(--color-accent)] font-medium hover:underline"
    >
      Create one
    </Link>
  </p>
        

      </form>
    </AuthLayout>
  );
}