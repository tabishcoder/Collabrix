import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { FaTimes } from "react-icons/fa";

import {
  getSpaceMembers,
  updateSpaceMemberRole,
  removeSpaceMember,
  leaveSpace,
} from "./spaceApi";
import { getWorkspaceInvites, revokeInvite, sendInvite } from "../invites/inviteApi";
import { fetchSpaces, setActiveSpace } from "./spaceSlice";
import { setActiveProject } from "../projects/projectSlice";
import { canManageSpace, spaceRoleLabel, spaceRoleBadgeClass } from "../../utils/roles";

const avatarText = (nameOrEmail) => (nameOrEmail?.[0] || "?").toUpperCase();

export default function WorkspaceMembersModal({ onClose }) {
  const dispatch = useDispatch();
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

  const handleLeaveWorkspace = async () => {
    if (!spaceId) return;
    if (activeSpaceRole === "owner") {
      toast.error("Workspace owner cannot leave");
      return;
    }
    if (!window.confirm("Leave this workspace? You will lose access to its projects.")) return;
    setActingId("leave-space");
    try {
      await leaveSpace(spaceId);
      toast.success("Left workspace");
      dispatch(setActiveProject(null));
      dispatch(setActiveSpace(null));
      await dispatch(fetchSpaces()).unwrap();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to leave workspace");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:py-10 app-modal-backdrop">
      <div className="app-modal-panel flex w-full max-w-4xl max-h-[min(92dvh,880px)] flex-col overflow-hidden">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-card)_90%,transparent)] px-6 py-4 backdrop-blur-md">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-[var(--color-text-primary)]">Workspace members</h3>
            <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
              {activeSpace?.name} • Your role: {spaceRoleLabel(activeSpaceRole)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {activeSpaceRole && activeSpaceRole !== "owner" && (
              <button
                type="button"
                disabled={actingId === "leave-space"}
                onClick={handleLeaveWorkspace}
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-700 transition duration-200 ease-out hover:bg-red-500/16 active:scale-[0.98] disabled:opacity-60 dark:text-red-200"
                title="Leave workspace"
              >
                {actingId === "leave-space" ? "Leaving…" : "Leave"}
              </button>
            )}
            <button type="button" onClick={onClose} className="app-modal-close !p-1.5 text-base" aria-label="Close">
              <FaTimes className="text-sm" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="shrink-0 px-6 pt-4">
          <div className="flex items-center gap-2 border-b border-[var(--color-border)]">
            {[
              { key: "members", label: "Members" },
              { key: "invites", label: "Pending invites" },
              { key: "invite", label: "Invite" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                disabled={!isAdmin && t.key !== "members"}
                className={`border-b-2 px-3 py-2 text-sm font-medium transition duration-200 ease-out ${
                  tab === t.key
                    ? "border-indigo-500 text-[var(--color-text-primary)]"
                    : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                } ${!isAdmin && t.key !== "members" ? "cursor-not-allowed opacity-50" : ""}`}
              >
                {t.label}
              </button>
            ))}
            <div className="ml-auto pb-2 text-xs text-[var(--color-text-muted)]">
              {isAdmin ? "Admin controls enabled" : "Read-only"}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 min-h-0 overflow-y-auto flex-1">
          {/* Members */}
          {tab === "members" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--color-text-secondary)] font-medium">
                  {loadingMembers ? "Loading members..." : `${members.length} member(s)`}
                </p>
                <button
                  onClick={loadMembers}
                  className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200"
                >
                  Refresh
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-[var(--color-surface-muted)] text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                    <tr>
                      <th className="px-3 py-2 text-left">User</th>
                      <th className="px-3 py-2 text-left">Email</th>
                      <th className="px-3 py-2 text-left">Role</th>
                      <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => {
                      const u = m.user;
                      const userId = u?._id;
                      const isOwner = m.role === "owner";
                      const busy = actingId === userId;
                      return (
                        <tr key={userId} className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]">
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-3 min-w-[220px]">
                              <div
                                className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-surface-muted)] text-[11px] font-semibold text-[var(--color-primary)] ring-1 ring-[var(--color-border)]"
                                title={u?.name}
                              >
                                {avatarText(u?.name || u?.email)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[var(--color-text-primary)] font-medium truncate">{u?.name || "—"}</p>
                                <p className="text-xs text-[var(--color-text-muted)] truncate">{isOwner ? "Workspace owner" : "Member"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-[var(--color-text-secondary)]">{u?.email || "—"}</td>
                          <td className="px-3 py-2">
                            {isAdmin && !isOwner ? (
                              <select
                                value={m.role}
                                disabled={busy}
                                onChange={(e) => handleChangeRole(userId, e.target.value)}
                                className="app-control !w-auto min-w-[5.25rem] cursor-pointer px-2 py-1 text-xs disabled:opacity-60"
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
                          <td className="px-3 py-2 text-right">
                            {isAdmin && !isOwner ? (
                              <button
                                disabled={busy}
                                onClick={() => handleRemoveMember(userId)}
                                className="rounded-md border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-700 transition duration-200 ease-out hover:bg-red-500/16 active:scale-[0.98] disabled:opacity-60 dark:text-red-200"
                              >
                                Remove
                              </button>
                            ) : (
                              <span className="text-xs text-[var(--color-text-muted)]">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {!loadingMembers && members.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-[var(--color-text-muted)] text-sm">
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
                <p className="text-sm text-[var(--color-text-secondary)] font-medium">
                  {loadingInvites ? "Loading invites..." : `${invites.length} pending invite(s)`}
                </p>
                <button
                  onClick={loadInvites}
                  className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200"
                >
                  Refresh
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-[var(--color-surface-muted)] text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                    <tr>
                      <th className="px-3 py-2 text-left">Email</th>
                      <th className="px-3 py-2 text-left">Role</th>
                      <th className="px-3 py-2 text-left">Expires</th>
                      <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invites.map((inv) => {
                      const busy = actingId === inv._id;
                      return (
                        <tr key={inv._id} className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]">
                          <td className="px-3 py-2 text-[var(--color-text-secondary)]">{inv.email}</td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex px-2 py-1 rounded-full border text-xs ${spaceRoleBadgeClass(inv.role)}`}>
                              {spaceRoleLabel(inv.role)}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-[var(--color-text-muted)] text-xs">
                            {inv.expiresAt ? new Date(inv.expiresAt).toLocaleString() : "—"}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              disabled={busy}
                              onClick={() => handleRevokeInvite(inv._id)}
                              className="rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface-muted)] px-2.5 py-1.5 text-xs text-[var(--color-text-secondary)] transition duration-200 ease-out hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] active:scale-[0.98] disabled:opacity-60"
                            >
                              Revoke
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {!loadingInvites && invites.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-[var(--color-text-muted)] text-sm">
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
            <div className="overflow-hidden rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)]">
              <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
                <p className="text-sm text-[var(--color-text-secondary)] font-medium">Send a new invitation</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  Invite someone to join this workspace.
                </p>
              </div>
              <div className="p-4">
                <div className="text-xs text-[var(--color-text-muted)] mb-4">
                  Tip: After sending, switch to <span className="text-[var(--color-text-secondary)]">Pending invites</span> to revoke if needed.
                </div>
                <form onSubmit={handleSendInvite} className="space-y-4">
                  <div>
                    <label className="text-xs text-[var(--color-text-muted)] mb-1.5 block">Email *</label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@example.com"
                      className="app-control px-3 py-2.5 placeholder:text-[var(--color-text-muted)]"
                      required
                      disabled={!isAdmin || sendingInvite}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-[var(--color-text-muted)] mb-1.5 block">Role</label>
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
                          className={`rounded-lg border px-3 py-2.5 text-left transition duration-200 ease-out disabled:opacity-60 ${
                            inviteRole === r.value
                              ? "border-indigo-500/55 bg-indigo-600/14 text-indigo-950 shadow-[var(--shadow-card)] dark:text-white"
                              : "border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] active:scale-[0.99]"
                          }`}
                        >
                          <p className="text-sm font-medium">{r.title}</p>
                          <p className="text-[11px] text-[var(--color-text-muted)] leading-tight mt-0.5">{r.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!isAdmin || sendingInvite || !inviteEmail.trim()}
                    className="app-btn-modal-primary flex w-full items-center justify-center gap-2 rounded-lg py-2.5"
                  >
                    {sendingInvite ? "Sending…" : "Send invite"}
                  </button>
                </form>

                {inviteLink && (
                  <div className="mt-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 shadow-[var(--shadow-card)]">
                    <p className="mb-2 text-xs text-[var(--color-text-muted)]">Share link directly:</p>
                    <div className="flex items-center gap-2">
                      <p className="flex-1 truncate font-mono text-xs text-[var(--color-text-secondary)]">{inviteLink}</p>
                      <button
                        type="button"
                        onClick={copyLink}
                        className="shrink-0 rounded-md bg-[var(--color-card)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)] transition duration-200 ease-out hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] active:scale-[0.98]"
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

