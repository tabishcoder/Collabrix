import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { getInviteInfo, acceptInvite } from "./inviteApi";

export default function JoinWorkspace() {
  const [searchParams]          = useSearchParams();
  const navigate                = useNavigate();
  const token                   = searchParams.get("token");

  const { isAuthenticated }     = useSelector((s) => s.auth);

  const [invite, setInvite]     = useState(null);
  const [status, setStatus]     = useState("loading"); // loading | ready | accepting | done | error
  const [errorMsg, setErrorMsg] = useState("");

  // ── Fetch invite metadata ──────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    getInviteInfo(token)
      .then((res) => {
        setInvite(res.data);
        setStatus("ready");
      })
      .catch((err) => {
        const msg = err.response?.data?.message || "Invalid or expired invitation.";
        setErrorMsg(msg);
        setStatus("error");
      });
  }, [token]);

  // Handle missing token without setState-in-effect
  if (!token && status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="bg-[#0f0f11] border border-red-500/30 rounded-xl p-8 max-w-md w-full mx-4 text-center">
          <p className="text-2xl mb-2">⚠️</p>
          <h2 className="text-xl font-bold text-white mb-2">Invitation Invalid</h2>
          <p className="text-white/50 mb-6">No invitation token found in the link.</p>
          <Link to="/login" className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  // ── Accept invite ──────────────────────────────────────────────────────────
  const handleAccept = async () => {
    if (!isAuthenticated) {
      // Preserve token so after login/register the user is redirected back
      navigate(`/login?redirect=/join-workspace?token=${token}`);
      return;
    }

    setStatus("accepting");
    try {
      await acceptInvite(token);
      toast.success(`Joined "${invite.workspace.name}" successfully!`);
      setStatus("done");
      // Give toast time to show, then navigate to dashboard
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to accept invitation.";
      toast.error(msg);
      setStatus("ready");
    }
  };

  // ── UI ─────────────────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <p className="text-white/60">Loading invitation...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="bg-[#0f0f11] border border-red-500/30 rounded-xl p-8 max-w-md w-full mx-4 text-center">
          <p className="text-2xl mb-2">⚠️</p>
          <h2 className="text-xl font-bold text-white mb-2">Invitation Invalid</h2>
          <p className="text-white/50 mb-6">{errorMsg}</p>
          <Link
            to="/login"
            className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="text-center">
          <p className="text-4xl mb-3">🎉</p>
          <p className="text-white text-xl font-bold">You're in!</p>
          <p className="text-white/50 mt-1">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  const roleLabel = invite?.role === "admin" ? "Admin" : "Member";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] px-4">
      <div className="bg-[#0f0f11] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl">

        {/* Workspace avatar */}
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-2xl font-bold text-white mx-auto mb-5">
          {invite?.workspace?.name?.[0]?.toUpperCase() || "W"}
        </div>

        <h1 className="text-2xl font-bold text-white text-center mb-1">
          You&apos;re invited!
        </h1>
        <p className="text-white/50 text-center mb-6">
          <strong className="text-white/80">{invite?.invitedBy}</strong> invited you
          to join{" "}
          <strong className="text-indigo-400">{invite?.workspace?.name}</strong> as a{" "}
          <span className="text-white/80 font-medium">{roleLabel}</span>.
        </p>

        {!isAuthenticated ? (
          <div className="space-y-3">
            <button
              onClick={handleAccept}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition"
            >
              Sign in to Accept
            </button>
            <Link
              to={`/register?redirect=/join-workspace?token=${token}`}
              className="block w-full py-3 text-center rounded-xl border border-white/12 text-white/70 hover:text-white hover:bg-white/5 font-medium transition"
            >
              Create account first
            </Link>
          </div>
        ) : (
          <button
            onClick={handleAccept}
            disabled={status === "accepting"}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold transition"
          >
            {status === "accepting" ? "Joining..." : `Join ${invite?.workspace?.name}`}
          </button>
        )}

        <p className="text-center text-white/30 text-xs mt-5">
          This invitation was sent to{" "}
          <span className="text-white/50">{invite?.email}</span>
        </p>
      </div>
    </div>
  );
}
