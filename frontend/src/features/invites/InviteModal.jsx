import { useState } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { FaTimes, FaCopy, FaEnvelope } from "react-icons/fa";
import { sendInvite } from "./inviteApi";

const ROLES = [
  { value: "member", label: "Member",  desc: "Can participate in projects they're added to" },
  { value: "admin",  label: "Admin",   desc: "Can manage workspace, invite members, create projects" },
];

export default function InviteModal({ onClose }) {
  const { activeSpace } = useSelector((s) => s.spaces);

  const [email,       setEmail]       = useState("");
  const [role,        setRole]        = useState("member");
  const [sending,     setSending]     = useState(false);
  const [inviteLink,  setInviteLink]  = useState("");
  const [linkCopied,  setLinkCopied]  = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSending(true);
    try {
      const res = await sendInvite({
        workspaceId: activeSpace._id,
        email:       email.trim().toLowerCase(),
        role
      });
      toast.success(`Invitation sent to ${email}`);
      setInviteLink(res.data.inviteLink || "");
      setEmail("");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send invite";
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  const copyLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setLinkCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setLinkCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10 sm:py-12 app-modal-backdrop">
      <div className="app-modal-panel w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-[var(--color-text-primary)]">Invite to Workspace</h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{activeSpace?.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--radius-sm)] p-1.5 text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
          >
            <FaTimes />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSend} className="px-6 py-5 space-y-4">
          {/* Email */}
          <div>
            <label className="text-xs text-[var(--color-text-muted)] mb-1.5 block">Email address *</label>
            <input
              autoFocus
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-input-bg)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] transition focus:border-indigo-500/60 focus:outline-none"
              required
            />
          </div>

          {/* Role picker */}
          <div>
            <label className="text-xs text-[var(--color-text-muted)] mb-1.5 block">Role</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`text-left px-3 py-2.5 rounded-[var(--radius-md)] border transition
                    ${role === r.value
                      ? "border-indigo-500/60 bg-indigo-600/15 text-indigo-950 dark:text-white"
                      : "border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
                    }`}
                >
                  <p className="text-sm font-medium">{r.label}</p>
                  <p className="text-[11px] text-[var(--color-text-muted)] leading-tight mt-0.5">{r.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={sending || !email.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[var(--radius-md)] bg-indigo-600 hover:bg-[var(--color-primary-hover)] disabled:opacity-50 text-white text-sm font-medium shadow-lg shadow-indigo-600/20 transition"
          >
            <FaEnvelope className="text-xs" />
            {sending ? "Sending…" : "Send Invitation"}
          </button>
        </form>

        {/* Invite link (shown after a successful send) */}
        {inviteLink && (
          <div className="px-6 pb-5">
            <div className="bg-white/[0.03] border border-[var(--color-border)] rounded-[var(--radius-md)] p-3">
              <p className="text-xs text-[var(--color-text-muted)] mb-2">Or share this link directly:</p>
              <div className="flex items-center gap-2">
                <p className="flex-1 text-xs text-[var(--color-text-secondary)] truncate font-mono">{inviteLink}</p>
                <button
                  onClick={copyLink}
                  className={`shrink-0 px-2.5 py-1.5 rounded-md text-xs font-medium transition
                    ${linkCopied
                      ? "bg-emerald-600/30 text-emerald-400"
                      : "bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
                    }`}
                >
                  <FaCopy className="inline mr-1 text-[10px]" />
                  {linkCopied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
