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
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
      <div className="bg-[#0f0f11] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div>
            <h3 className="text-base font-semibold text-white">Invite to Workspace</h3>
            <p className="text-xs text-white/40 mt-0.5">{activeSpace?.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white transition rounded-lg p-1"
          >
            <FaTimes />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSend} className="px-6 py-5 space-y-4">
          {/* Email */}
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Email address *</label>
            <input
              autoFocus
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/60 transition"
              required
            />
          </div>

          {/* Role picker */}
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Role</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`text-left px-3 py-2.5 rounded-lg border transition
                    ${role === r.value
                      ? "border-indigo-500/60 bg-indigo-600/15 text-white"
                      : "border-white/8 bg-white/3 text-white/50 hover:border-white/20 hover:text-white/80"
                    }`}
                >
                  <p className="text-sm font-medium">{r.label}</p>
                  <p className="text-[11px] text-white/40 leading-tight mt-0.5">{r.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={sending || !email.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition"
          >
            <FaEnvelope className="text-xs" />
            {sending ? "Sending…" : "Send Invitation"}
          </button>
        </form>

        {/* Invite link (shown after a successful send) */}
        {inviteLink && (
          <div className="px-6 pb-5">
            <div className="bg-white/4 border border-white/8 rounded-lg p-3">
              <p className="text-xs text-white/40 mb-2">Or share this link directly:</p>
              <div className="flex items-center gap-2">
                <p className="flex-1 text-xs text-white/60 truncate font-mono">{inviteLink}</p>
                <button
                  onClick={copyLink}
                  className={`shrink-0 px-2.5 py-1.5 rounded-md text-xs font-medium transition
                    ${linkCopied
                      ? "bg-emerald-600/30 text-emerald-400"
                      : "bg-white/8 text-white/60 hover:bg-white/15 hover:text-white"
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
