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
        <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-card)_88%,transparent)] px-6 py-4 backdrop-blur-sm">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-[var(--color-text-primary)]">Invite to Workspace</h3>
            <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{activeSpace?.name}</p>
          </div>
          <button type="button" onClick={onClose} className="app-modal-close !p-1.5 text-base" aria-label="Close">
            <FaTimes className="text-sm" />
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
              className="app-control px-3 py-2.5 placeholder:text-[var(--color-text-muted)]"
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
                  className={`rounded-[var(--radius-md)] border px-3 py-2.5 text-left transition duration-200 ease-out
                    ${role === r.value
                      ? "border-indigo-500/55 bg-indigo-600/14 text-indigo-950 shadow-[var(--shadow-card)] dark:text-white"
                      : "border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] active:scale-[0.99]"
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
            className="app-btn-modal-primary flex w-full items-center justify-center gap-2 py-2.5"
          >
            <FaEnvelope className="text-xs" />
            {sending ? "Sending…" : "Send Invitation"}
          </button>
        </form>

        {/* Invite link (shown after a successful send) */}
        {inviteLink && (
          <div className="px-6 pb-5">
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 shadow-[var(--shadow-card)]">
              <p className="text-xs text-[var(--color-text-muted)] mb-2">Or share this link directly:</p>
              <div className="flex items-center gap-2">
                <p className="flex-1 text-xs text-[var(--color-text-secondary)] truncate font-mono">{inviteLink}</p>
                <button
                  onClick={copyLink}
                  className={`shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium transition duration-200 ease-out
                    ${linkCopied
                      ? "bg-emerald-600/30 text-emerald-400"
                      : "bg-[var(--color-card)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] active:scale-[0.98]"
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
