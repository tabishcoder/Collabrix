import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { FaTimes } from "react-icons/fa";

import {
  getSpaceMembers,
  updateSpaceMemberRole,
  removeSpaceMember,
} from "./spaceApi";
import { getWorkspaceInvites, revokeInvite, sendInvite } from "../invites/inviteApi";
import { canManageSpace, spaceRoleLabel, spaceRoleBadgeClass } from "../../utils/roles";

const avatarText = (nameOrEmail) => (nameOrEmail?.[0] || "?").toUpperCase();

export default function WorkspaceMembersModal({ onClose }) {
  const { activeSpace, activeSpaceRole } = useSelector((s) => s.spaces);
  const isAdmin = canManageSpace(activeSpaceRole);

  const [tab, setTab] = useState("members"); // members | invites | invite
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [actingId, setActingId] = useState(null); // userId or inviteId
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteLink, setInviteLink] = useState("");

  const spaceId = activeSpace?._id;

  const ownerUserId = useMemo(() => {
    // members endpoint returns { user, role:'owner' } for owner
    const ownerRow = members.find((m) => m.role === "owner");
    return ownerRow?.user?._id;
  }, [members]);

  const loadMembers = async () => {
    if (!spaceId) return;
    setLoadingMembers(true);
    try {
      const res = await getSpaceMembers(spaceId);
      setMembers(res.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load members");
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadInvites = async () => {
    if (!spaceId) return;
    setLoadingInvites(true);
    try {
      const res = await getWorkspaceInvites(spaceId);
      setInvites(res.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load pending invites");
    } finally {
      setLoadingInvites(false);
    }
  };

  useEffect(() => {
    loadMembers();
    if (isAdmin) loadInvites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spaceId]);

  const handleChangeRole = async (userId, role) => {
    if (!isAdmin) return;
    if (!spaceId) return;
    if (userId === ownerUserId) return;
    setActingId(userId);
    try {
      await updateSpaceMemberRole(spaceId, userId, role);
      toast.success("Role updated");
      await loadMembers();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update role");
    } finally {
      setActingId(null);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!isAdmin) return;
    if (!spaceId) return;
    if (userId === ownerUserId) return;
    if (!window.confirm("Remove this member from the workspace?")) return;
    setActingId(userId);
    try {
      await removeSpaceMember(spaceId, userId);
      toast.success("Member removed");
      await loadMembers();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to remove member");
    } finally {
      setActingId(null);
    }
  };

  const handleRevokeInvite = async (inviteId) => {
    if (!isAdmin) return;
    if (!window.confirm("Revoke this invite?")) return;
    setActingId(inviteId);
    try {
      await revokeInvite(inviteId);
      toast.success("Invite revoked");
      await loadInvites();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to revoke invite");
    } finally {
      setActingId(null);
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!spaceId) return;
    if (!inviteEmail.trim()) return;
    setSendingInvite(true);
    setInviteLink("");
    try {
      const res = await sendInvite({
        workspaceId: spaceId,
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
      });
      toast.success("Invitation sent");
      setInviteLink(res.data?.inviteLink || "");
      setInviteEmail("");
      await loadInvites();
      setTab("invites");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send invite");
    } finally {
      setSendingInvite(false);
    }
  };

  const copyLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success("Link copied");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
      <div className="bg-[#0f0f11] border border-white/10 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div>
            <h3 className="text-base font-semibold text-white">Workspace members</h3>
            <p className="text-xs text-white/40 mt-0.5">
              {activeSpace?.name} • Your role: {spaceRoleLabel(activeSpaceRole)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white transition rounded-lg p-1"
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-2 border-b border-white/8">
            {[
              { key: "members", label: "Members" },
              { key: "invites", label: "Pending invites" },
              { key: "invite", label: "Invite" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                disabled={!isAdmin && t.key !== "members"}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition ${
                  tab === t.key
                    ? "text-white border-indigo-500"
                    : "text-white/50 border-transparent hover:text-white/70"
                } ${!isAdmin && t.key !== "members" ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {t.label}
              </button>
            ))}
            <div className="ml-auto text-xs text-white/30 pb-2">
              {isAdmin ? "Admin controls enabled" : "Read-only"}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {/* Members */}
          {tab === "members" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/70 font-medium">
                  {loadingMembers ? "Loading members..." : `${members.length} member(s)`}
                </p>
                <button
                  onClick={loadMembers}
                  className="text-xs text-indigo-300 hover:text-indigo-200"
                >
                  Refresh
                </button>
              </div>

              <div className="overflow-x-auto border border-white/8 rounded-xl">
                <table className="w-full text-sm">
                  <thead className="bg-white/3 text-white/50 text-xs">
                    <tr>
                      <th className="text-left px-4 py-3">User</th>
                      <th className="text-left px-4 py-3">Email</th>
                      <th className="text-left px-4 py-3">Role</th>
                      <th className="text-right px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => {
                      const u = m.user;
                      const userId = u?._id;
                      const isOwner = m.role === "owner";
                      const busy = actingId === userId;
                      return (
                        <tr key={userId} className="border-t border-white/8 hover:bg-white/3">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3 min-w-[220px]">
                              <div
                                className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white"
                                title={u?.name}
                              >
                                {avatarText(u?.name || u?.email)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-white/80 font-medium truncate">{u?.name || "—"}</p>
                                <p className="text-xs text-white/35 truncate">{isOwner ? "Workspace owner" : "Member"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-white/60">{u?.email || "—"}</td>
                          <td className="px-4 py-3">
                            {isAdmin && !isOwner ? (
                              <select
                                value={m.role}
                                disabled={busy}
                                onChange={(e) => handleChangeRole(userId, e.target.value)}
                                className="text-xs rounded-md bg-white/5 border border-white/10 text-white/70 px-2 py-1 focus:outline-none focus:border-indigo-500/50 cursor-pointer disabled:opacity-60"
                              >
                                <option value="member">Member</option>
                                <option value="admin">Admin</option>
                              </select>
                            ) : (
                              <span className={`inline-flex px-2 py-1 rounded-full border text-xs ${spaceRoleBadgeClass(m.role)}`}>
                                {spaceRoleLabel(m.role)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {isAdmin && !isOwner ? (
                              <button
                                disabled={busy}
                                onClick={() => handleRemoveMember(userId)}
                                className="text-xs px-2.5 py-1.5 rounded-md bg-red-500/10 border border-red-500/25 text-red-200 hover:bg-red-500/15 disabled:opacity-60"
                              >
                                Remove
                              </button>
                            ) : (
                              <span className="text-xs text-white/20">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {!loadingMembers && members.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-white/30 text-sm">
                          No members found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pending Invites */}
          {tab === "invites" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/70 font-medium">
                  {loadingInvites ? "Loading invites..." : `${invites.length} pending invite(s)`}
                </p>
                <button
                  onClick={loadInvites}
                  className="text-xs text-indigo-300 hover:text-indigo-200"
                >
                  Refresh
                </button>
              </div>

              <div className="overflow-x-auto border border-white/8 rounded-xl">
                <table className="w-full text-sm">
                  <thead className="bg-white/3 text-white/50 text-xs">
                    <tr>
                      <th className="text-left px-4 py-3">Email</th>
                      <th className="text-left px-4 py-3">Role</th>
                      <th className="text-left px-4 py-3">Expires</th>
                      <th className="text-right px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invites.map((inv) => {
                      const busy = actingId === inv._id;
                      return (
                        <tr key={inv._id} className="border-t border-white/8 hover:bg-white/3">
                          <td className="px-4 py-3 text-white/70">{inv.email}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 rounded-full border text-xs ${spaceRoleBadgeClass(inv.role)}`}>
                              {spaceRoleLabel(inv.role)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-white/50 text-xs">
                            {inv.expiresAt ? new Date(inv.expiresAt).toLocaleString() : "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              disabled={busy}
                              onClick={() => handleRevokeInvite(inv._id)}
                              className="text-xs px-2.5 py-1.5 rounded-md bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/8 disabled:opacity-60"
                            >
                              Revoke
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {!loadingInvites && invites.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-white/30 text-sm">
                          No pending invites.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Invite (reuse existing InviteModal UI inline by rendering it) */}
          {tab === "invite" && (
            <div className="rounded-xl border border-white/8 overflow-hidden">
              <div className="p-4 bg-white/3 border-b border-white/8">
                <p className="text-sm text-white/70 font-medium">Send a new invitation</p>
                <p className="text-xs text-white/40 mt-1">
                  Invite someone to join this workspace.
                </p>
              </div>
              <div className="p-4">
                <div className="text-xs text-white/40 mb-4">
                  Tip: After sending, switch to <span className="text-white/60">Pending invites</span> to revoke if needed.
                </div>
                <form onSubmit={handleSendInvite} className="space-y-4">
                  <div>
                    <label className="text-xs text-white/50 mb-1.5 block">Email *</label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@example.com"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/60 transition"
                      required
                      disabled={!isAdmin || sendingInvite}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/50 mb-1.5 block">Role</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: "member", title: "Member", desc: "Can participate in projects they're added to" },
                        { value: "admin", title: "Admin", desc: "Can manage workspace, invite, create projects" },
                      ].map((r) => (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setInviteRole(r.value)}
                          disabled={!isAdmin || sendingInvite}
                          className={`text-left px-3 py-2.5 rounded-lg border transition disabled:opacity-60 ${
                            inviteRole === r.value
                              ? "border-indigo-500/60 bg-indigo-600/15 text-white"
                              : "border-white/8 bg-white/3 text-white/50 hover:border-white/20 hover:text-white/80"
                          }`}
                        >
                          <p className="text-sm font-medium">{r.title}</p>
                          <p className="text-[11px] text-white/40 leading-tight mt-0.5">{r.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!isAdmin || sendingInvite || !inviteEmail.trim()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition"
                  >
                    {sendingInvite ? "Sending…" : "Send invite"}
                  </button>
                </form>

                {inviteLink && (
                  <div className="mt-4 bg-white/4 border border-white/8 rounded-lg p-3">
                    <p className="text-xs text-white/40 mb-2">Share link directly:</p>
                    <div className="flex items-center gap-2">
                      <p className="flex-1 text-xs text-white/60 truncate font-mono">{inviteLink}</p>
                      <button
                        type="button"
                        onClick={copyLink}
                        className="shrink-0 px-2.5 py-1.5 rounded-md text-xs font-medium transition bg-white/8 text-white/60 hover:bg-white/15 hover:text-white"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

