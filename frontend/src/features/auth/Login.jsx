import { useState } from "react";
import { useDispatch } from "react-redux";
import { login, getMe } from "./authSlice";
import toast from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { assests } from "../../assets/images/assests";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }
    if (!email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    try {
      setLoading(true);
      await dispatch(login({ email, password })).unwrap();
      await dispatch(getMe()).unwrap();
      toast.success("Logged in successfully");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    toast("Google login clicked");
    // TODO: Google OAuth
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[var(--color-bg)]">
      {/* Left Branding Section */}
      <div className="lg:w-1/2 flex flex-col justify-center bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-highlight)] text-[var(--color-text-primary)] px-10 py-16">
        <div className="flex justify-center mb-6 lg:justify-start">
          <img
            src={assests.logo}
            alt="Collabrix Logo"
            className="h-24 w-auto"
          />
        </div>

        <h1 className="text-4xl font-extrabold mb-4">Welcome to Collabrix</h1>

        <p className="text-lg text-[var(--color-text-secondary)] max-w-md">
          AI Powered Unified Remote Teams Workplace. Collaborate, track, and
          manage your team effortlessly.
        </p>

        <div className="mt-8">
          <p className="text-[var(--color-text-secondary)] text-sm max-w-sm">
            New here?{" "}
            <Link
              to="/register"
              className="font-semibold underline hover:text-[var(--color-accent)]"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>

      {/* Right Login Form Section */}
      <div className="lg:w-1/2 flex items-center justify-center bg-[var(--color-bg)] px-6 py-16">
        <div className="w-full max-w-md bg-[var(--color-card)] rounded-3xl shadow-2xl p-10 border border-white/5">
          <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-6 text-center">
            Sign in
          </h2>

          {/* Google Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 border border-white/10 py-3 rounded-xl hover:bg-white/5 transition mb-5 font-medium text-[var(--color-text-primary)]"
          >
            <FcGoogle size={24} />
            Sign in with Google
          </button>

          <div className="flex items-center my-4">
            <hr className="flex-1 border-white/10" />
            <span className="mx-2 text-[var(--color-text-secondary)] text-sm font-medium">
              or
            </span>
            <hr className="flex-1 border-white/10" />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <input
              type="email"
              placeholder="Email address"
              className="w-full px-5 py-3 bg-transparent border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              className="w-full px-5 py-3 bg-transparent border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="flex justify-between items-center text-sm text-[var(--color-text-secondary)]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded accent-[var(--color-primary)]"
                />
                Remember me
              </label>

              <Link
                to="/forgot-password"
                className="text-[var(--color-accent)] font-medium hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--color-primary)] text-white py-3 rounded-xl font-semibold hover:bg-[var(--color-highlight)] transition disabled:opacity-50 mt-2"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );

}
