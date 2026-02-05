import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { register } from "./authSlice";
import toast from "react-hot-toast";

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!name || !email || !password) {
      toast.error("All fields are required");
      return;
    }

    if (!email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      const res = await dispatch(register({ name, email, password })).unwrap();
      console.log(res);
      toast.success("OTP sent to your email");
      navigate(`/verify-otp/${res.userId}`);
    } catch (err) {
      toast.error(err?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[var(--color-bg)]">
      {/* Left Branding Section */}
      <div className="lg:w-1/2 flex flex-col justify-center bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-highlight)] text-[var(--color-text-primary)] px-10 py-16">
        <h1 className="text-4xl font-extrabold mb-4">Join Collabrix</h1>

        <p className="text-lg text-[var(--color-text-secondary)] max-w-md">
          Create your account and experience an AI-powered unified collaboration
          platform for modern remote teams.
        </p>

        <p className="mt-6 text-sm text-[var(--color-text-secondary)]">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="cursor-pointer font-semibold underline hover:text-[var(--color-accent)]"
          >
            Sign in
          </span>
        </p>
      </div>

      {/* Right Register Form Section */}
      <div className="lg:w-1/2 flex items-center justify-center bg-[var(--color-bg)] px-6 py-16">
        <form
          onSubmit={handleRegister}
          className="w-full max-w-md bg-[var(--color-card)] rounded-3xl shadow-2xl p-10 border border-white/5"
        >
          <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-6 text-center">
            Create Account
          </h2>

          <input
            type="text"
            placeholder="Full name"
            className="w-full mb-4 px-5 py-3 bg-transparent border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)]"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            type="email"
            placeholder="Email address"
            className="w-full mb-4 px-5 py-3 bg-transparent border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full mb-6 px-5 py-3 bg-transparent border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--color-primary)] text-white py-3 rounded-xl font-semibold hover:bg-[var(--color-highlight)] transition disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>
      </div>
    </div>
  );

}
