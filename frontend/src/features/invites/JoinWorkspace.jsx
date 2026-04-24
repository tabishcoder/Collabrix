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
  const [status, setStatus]     = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");

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

  if (!token && status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
        <div className="app-modal-panel w-full max-w-md rounded-xl border border-red-500/30 p-8 text-center">
          <p className="mb-2 text-2xl">⚠️</p>
          <h2 className="mb-2 text-xl font-bold text-[var(--color-text-primary)]">Invitation Invalid</h2>
          <p className="mb-6 text-[var(--color-text-muted)]">No invitation token found in the link.</p>
          <Link
            to="/login"
            className="inline-block rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white transition hover:bg-indigo-500"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  const handleAccept = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/join-workspace?token=${token}`);
      return;
    }

    setStatus("accepting");
    try {
      await acceptInvite(token);
      toast.success(`Joined "${invite.workspace.name}" successfully!`);
      setStatus("done");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to accept invitation.";
      toast.error(msg);
      setStatus("ready");
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
        <p className="text-[var(--color-text-secondary)]">Loading invitation...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
        <div className="app-modal-panel w-full max-w-md rounded-xl border border-red-500/30 p-8 text-center">
          <p className="mb-2 text-2xl">⚠️</p>
          <h2 className="mb-2 text-xl font-bold text-[var(--color-text-primary)]">Invitation Invalid</h2>
          <p className="mb-6 text-[var(--color-text-muted)]">{errorMsg}</p>
          <Link
            to="/login"
            className="inline-block rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white transition hover:bg-indigo-500"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
        <div className="text-center">
          <p className="mb-3 text-4xl">🎉</p>
          <p className="text-xl font-bold text-[var(--color-text-primary)]">You&apos;re in!</p>
          <p className="mt-1 text-[var(--color-text-muted)]">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  const roleLabel = invite?.role === "admin" ? "Admin" : "Member";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="app-modal-panel w-full max-w-md rounded-2xl border border-[var(--color-border-strong)] p-8 shadow-2xl">

        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-bold text-white">
          {invite?.workspace?.name?.[0]?.toUpperCase() || "W"}
        </div>

        <h1 className="mb-1 text-center text-2xl font-bold text-[var(--color-text-primary)]">
          You&apos;re invited!
        </h1>
        <p className="mb-6 text-center text-[var(--color-text-muted)]">
          <strong className="text-[var(--color-text-primary)]">{invite?.invitedBy}</strong> invited you
          to join{" "}
          <strong className="text-indigo-600 dark:text-indigo-400">{invite?.workspace?.name}</strong> as a{" "}
          <span className="font-medium text-[var(--color-text-secondary)]">{roleLabel}</span>.
        </p>

        {!isAuthenticated ? (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleAccept}
              className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-500"
            >
              Sign in to Accept
            </button>
            <Link
              to={`/register?redirect=/join-workspace?token=${token}`}
              className="block w-full rounded-xl border border-[var(--color-border-strong)] py-3 text-center font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
            >
              Create account first
            </Link>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleAccept}
            disabled={status === "accepting"}
            className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
          >
            {status === "accepting" ? "Joining..." : `Join ${invite?.workspace?.name}`}
          </button>
        )}

        <p className="mt-5 text-center text-xs text-[var(--color-text-muted)]">
          This invitation was sent to{" "}
          <span className="text-[var(--color-text-secondary)]">{invite?.email}</span>
        </p>
      </div>
    </div>
  );
}
