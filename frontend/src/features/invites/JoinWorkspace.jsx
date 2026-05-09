import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { FaExclamationTriangle, FaCheck } from "react-icons/fa";
import { getInviteInfo, acceptInvite } from "./inviteApi";

function Panel({ children, className = "" }) {
  return (
    <div
      className={`app-modal-panel w-full max-w-md p-6 text-center sm:p-8 ${className}`}
    >
      {children}
    </div>
  );
}

export default function JoinWorkspace() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const { isAuthenticated } = useSelector((s) => s.auth);

  const [invite, setInvite] = useState(null);
  const [status, setStatus] = useState("loading");
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
        <Panel className="border border-red-500/25 bg-red-500/[0.04] dark:bg-red-500/10">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400">
            <FaExclamationTriangle className="text-lg" aria-hidden />
          </div>
          <h2 className="mb-2 text-lg font-semibold tracking-tight text-[var(--color-text-primary)]">
            Invitation invalid
          </h2>
          <p className="mb-6 text-[13px] text-[var(--color-text-muted)]">No invitation token was found in this link.</p>
          <Link to="/login" className="app-btn-modal-primary inline-flex w-full justify-center no-underline sm:w-auto">
            Back to login
          </Link>
        </Panel>
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
      setTimeout(() => navigate("/welcome"), 1500);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to accept invitation.";
      toast.error(msg);
      setStatus("ready");
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
        <p className="text-[13px] text-[var(--color-text-muted)]">Loading invitation…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
        <Panel className="border border-red-500/25 bg-red-500/[0.04] dark:bg-red-500/10">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400">
            <FaExclamationTriangle className="text-lg" aria-hidden />
          </div>
          <h2 className="mb-2 text-lg font-semibold tracking-tight text-[var(--color-text-primary)]">
            Invitation invalid
          </h2>
          <p className="mb-6 text-[13px] text-[var(--color-text-muted)]">{errorMsg}</p>
          <Link to="/login" className="app-btn-modal-primary inline-flex w-full justify-center no-underline sm:w-auto">
            Back to login
          </Link>
        </Panel>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface-muted)] text-[var(--color-primary)]">
            <FaCheck className="text-xl" aria-hidden />
          </div>
          <p className="text-lg font-semibold tracking-tight text-[var(--color-text-primary)]">You&apos;re in</p>
          <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">Redirecting to your dashboard…</p>
        </div>
      </div>
    );
  }

  const roleLabel = invite?.role === "admin" ? "Admin" : "Member";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-8">
      <Panel>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface-muted)] text-lg font-semibold text-[var(--color-primary)]">
          {invite?.workspace?.name?.[0]?.toUpperCase() || "W"}
        </div>

        <h1 className="mb-1 text-center text-xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-2xl">
          You&apos;re invited
        </h1>
        <p className="mb-6 text-center text-[13px] leading-relaxed text-[var(--color-text-muted)]">
          <span className="font-medium text-[var(--color-text-primary)]">{invite?.invitedBy}</span> invited you to join{" "}
          <span className="font-semibold text-[var(--color-text-primary)]">{invite?.workspace?.name}</span> as{" "}
          <span className="text-[var(--color-text-secondary)]">{roleLabel}</span>.
        </p>

        {!isAuthenticated ? (
          <div className="space-y-2">
            <button type="button" onClick={handleAccept} className="app-btn-modal-primary w-full justify-center py-2.5 text-[13px]">
              Sign in to accept
            </button>
            <Link
              to={`/register?redirect=/join-workspace?token=${token}`}
              className="app-btn-modal-secondary flex w-full justify-center py-2.5 text-[13px] no-underline"
            >
              Create account first
            </Link>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleAccept}
            disabled={status === "accepting"}
            className="app-btn-modal-primary w-full justify-center py-2.5 text-[13px] disabled:opacity-60"
          >
            {status === "accepting" ? "Joining…" : `Join ${invite?.workspace?.name}`}
          </button>
        )}

        <p className="mt-5 text-center text-[11px] text-[var(--color-text-muted)]">
          This invitation was sent to{" "}
          <span className="font-medium text-[var(--color-text-secondary)]">{invite?.email}</span>
        </p>
      </Panel>
    </div>
  );
}
