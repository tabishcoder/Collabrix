import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  addProjectMemberApi,
  updateProjectMemberRoleApi,
  removeProjectMemberApi,
  leaveProjectApi,
} from "./projectApi";
import { fetchProjectById } from "./projectSlice";
import { getSpaceMembers } from "../spaces/spaceApi";
import { setActiveProject } from "./projectSlice";
import { canManageProject, projectRoleLabel, projectRoleBadgeClass } from "../../utils/roles";

export default function ProjectMembersPanel() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { activeProject } = useSelector((s) => s.projects);
  const { activeSpace } = useSelector((s) => s.spaces);
  const { user } = useSelector((s) => s.auth);

  const projectId = activeProject?._id;
  const myRole = activeProject?.myRole ?? null;
  const canManage = canManageProject(myRole);
  const myUserId = user?._id;

  const [spaceMembers, setSpaceMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState(null);

  const [addUserId, setAddUserId] = useState("");
  const [addRole, setAddRole] = useState("contributor");

  const projectMemberUserIds = useMemo(() => {
    const set = new Set();
    (activeProject?.members || []).forEach((m) => {
      if (m?.user?._id) set.add(m.user._id);
    });
    return set;
  }, [activeProject?.members]);

  const eligibleSpaceUsers = useMemo(() => {
    return (spaceMembers || [])
      .map((m) => m?.user)
      .filter((u) => u?._id && !projectMemberUserIds.has(u._id));
  }, [spaceMembers, projectMemberUserIds]);

  const load = async () => {
    if (!projectId || !activeSpace?._id) return;
    setLoading(true);
    try {
      const res = await getSpaceMembers(activeSpace._id);
      setSpaceMembers(res.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load space members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, activeSpace?._id]);

  const refreshProject = async () => {
    if (!projectId) return;
    await dispatch(fetchProjectById(projectId)).unwrap();
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!canManage) return;
    if (!projectId || !addUserId) return;
    setActingId(addUserId);
    try {
      await addProjectMemberApi(projectId, addUserId, addRole);
      toast.success("Member added to project");
      setAddUserId("");
      setAddRole("contributor");
      await refreshProject();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add member");
    } finally {
      setActingId(null);
    }
  };

  const handleChangeRole = async (userId, role) => {
    if (!canManage) return;
    if (!projectId) return;
    setActingId(userId);
    try {
      await updateProjectMemberRoleApi(projectId, userId, role);
      toast.success("Role updated");
      await refreshProject();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update role");
    } finally {
      setActingId(null);
    }
  };

  const handleRemove = async (userId) => {
    if (!canManage) return;
    if (!projectId) return;
    if (!window.confirm("Remove this member from the project?")) return;
    setActingId(userId);
    try {
      await removeProjectMemberApi(projectId, userId);
      toast.success("Member removed");
      await refreshProject();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to remove member");
    } finally {
      setActingId(null);
    }
  };

  const myMembership = useMemo(() => {
    if (!myUserId) return null;
    return (activeProject?.members || []).find((m) => m?.user?._id === myUserId) || null;
  }, [activeProject?.members, myUserId]);

  const canSelfLeaveProject =
    Boolean(projectId && myMembership) && myRole !== "owner" && myRole !== "admin";

  const handleLeaveProject = async () => {
    if (!canSelfLeaveProject) return;
    if (!window.confirm("Leave this project?")) return;
    setActingId("leave-project");
    try {
      await leaveProjectApi(projectId);
      toast.success("Left project");
      dispatch(setActiveProject(null));
      navigate("/projects");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to leave project");
    } finally {
      setActingId(null);
    }
  };

  if (!activeProject) {
    return <div className="p-6 text-[var(--color-text-muted)]">Select a project.</div>;
  }

  return (
    <div className="space-y-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight text-[var(--color-text-primary)]">Project members</h3>
          <p className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">
            Manage who is in this project and what they can do.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {canSelfLeaveProject && (
            <button
              type="button"
              disabled={actingId === "leave-project"}
              onClick={handleLeaveProject}
              className="rounded-md border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-[12px] font-medium text-red-700 transition-colors duration-150 hover:bg-red-500/15 disabled:opacity-60 dark:text-red-200"
              title="Leave project"
            >
              {actingId === "leave-project" ? "Leaving…" : "Leave project"}
            </button>
          )}
          <button
            type="button"
            onClick={async () => {
              await refreshProject();
              await load();
              toast.success("Refreshed");
            }}
            className="rounded-md border border-[var(--color-border-strong)] bg-[var(--color-card)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--color-text-secondary)] transition-colors duration-150 hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)]/60 p-4">
        <div className="mb-2.5 flex items-center justify-between">
          <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">Add member</p>
          {!canManage && (
            <span className="text-xs text-[var(--color-text-muted)]">Manager role required</span>
          )}
        </div>

        <form onSubmit={handleAdd} className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_180px_120px]">
          <select
            value={addUserId}
            onChange={(e) => setAddUserId(e.target.value)}
            disabled={!canManage || loading}
            className="app-control cursor-pointer px-2.5 py-2 text-[13px] disabled:opacity-60"
          >
            <option value="">
              {loading ? "Loading space members…" : "Select a workspace member"}
            </option>
            {eligibleSpaceUsers.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>

          <select
            value={addRole}
            onChange={(e) => setAddRole(e.target.value)}
            disabled={!canManage}
            className="app-control cursor-pointer px-2.5 py-2 text-[13px] disabled:opacity-60"
          >
            <option value="manager">Manager</option>
            <option value="contributor">Contributor</option>
            <option value="viewer">Viewer</option>
          </select>

          <button
            type="submit"
            disabled={!canManage || !addUserId || actingId === addUserId}
            className="app-btn-modal-primary w-full justify-center rounded-md py-2 text-[13px] disabled:opacity-60"
          >
            {actingId === addUserId ? "Adding…" : "Add"}
          </button>
        </form>

        {!loading && eligibleSpaceUsers.length === 0 && (
          <p className="mt-3 text-xs text-[var(--color-text-muted)]">
            Everyone in the workspace is already in this project.
          </p>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] shadow-sm">
        <table className="w-full text-[13px]">
          <thead className="sticky top-0 z-10 bg-[var(--color-surface-muted)] text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            <tr>
              <th className="px-3 py-2 text-left">User</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Role</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(activeProject.members || []).map((m) => {
              const u = m.user;
              const userId = u?._id;
              const busy = actingId === userId;
              return (
                <tr key={userId} className="border-t border-[var(--color-border)] transition-colors duration-150 hover:bg-[var(--color-surface-muted)]/80">
                  <td className="px-3 py-2">
                    <div className="flex min-w-[200px] items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--color-surface-muted)] text-[11px] font-semibold text-[var(--color-primary)] ring-1 ring-[var(--color-border)]">
                        {(u?.name?.[0] || u?.email?.[0] || "?").toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[var(--color-text-primary)]">{u?.name || "—"}</p>
                        <p className="truncate text-xs text-[var(--color-text-muted)]">{projectRoleLabel(m.role)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-[var(--color-text-secondary)]">{u?.email || "—"}</td>
                  <td className="px-3 py-2">
                    {canManage ? (
                      <select
                        value={m.role}
                        disabled={busy}
                        onChange={(e) => handleChangeRole(userId, e.target.value)}
                        className="app-control !w-auto min-w-[5.5rem] cursor-pointer px-2 py-1 text-[11px] disabled:opacity-60"
                      >
                        <option value="manager">Manager</option>
                        <option value="contributor">Contributor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <span className={`inline-flex rounded-full border px-2 py-1 text-xs ${projectRoleBadgeClass(m.role)}`}>
                        {projectRoleLabel(m.role)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canManage ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleRemove(userId)}
                        className="rounded-md border border-red-500/25 bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-500/15 disabled:opacity-60 dark:text-red-200"
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

            {(activeProject.members || []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-5 text-center text-[13px] text-[var(--color-text-muted)]">
                  No project members found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
