import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";

import {
  addProjectMemberApi,
  updateProjectMemberRoleApi,
  removeProjectMemberApi,
} from "./projectApi";
import { fetchProjectById } from "./projectSlice";
import { getSpaceMembers } from "../spaces/spaceApi";
import { canManageProject, projectRoleLabel, projectRoleBadgeClass } from "../../utils/roles";

export default function ProjectMembersPanel() {
  const dispatch = useDispatch();
  const { activeProject } = useSelector((s) => s.projects);
  const { activeSpace } = useSelector((s) => s.spaces);

  const projectId = activeProject?._id;
  const myRole = activeProject?.myRole ?? null;
  const canManage = canManageProject(myRole);

  const [spaceMembers, setSpaceMembers] = useState([]); // [{user, role}]
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
    // space members endpoint includes owner as {user, role:'owner'}
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

  if (!activeProject) {
    return <div className="p-6 text-white/40">Select a project.</div>;
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Project members</h3>
          <p className="text-xs text-white/40 mt-1">
            Manage who is in this project and what they can do.
          </p>
        </div>
        <button
          onClick={async () => {
            await refreshProject();
            await load();
            toast.success("Refreshed");
          }}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white text-sm transition"
        >
          Refresh
        </button>
      </div>

      {/* Add member */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-white/80">Add member</p>
          {!canManage && (
            <span className="text-xs text-white/30">Manager role required</span>
          )}
        </div>

        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-[1fr_180px_140px] gap-3">
          <select
            value={addUserId}
            onChange={(e) => setAddUserId(e.target.value)}
            disabled={!canManage || loading}
            className="w-full p-2.5 rounded-lg bg-[var(--color-bg)] border border-white/10 text-white/80 text-sm focus:outline-none focus:border-indigo-500/50 disabled:opacity-60"
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
            className="w-full p-2.5 rounded-lg bg-[var(--color-bg)] border border-white/10 text-white/80 text-sm focus:outline-none focus:border-indigo-500/50 disabled:opacity-60"
          >
            <option value="manager">Manager</option>
            <option value="contributor">Contributor</option>
            <option value="viewer">Viewer</option>
          </select>

          <button
            type="submit"
            disabled={!canManage || !addUserId || actingId === addUserId}
            className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium transition"
          >
            {actingId === addUserId ? "Adding…" : "Add"}
          </button>
        </form>

        {!loading && eligibleSpaceUsers.length === 0 && (
          <p className="text-xs text-white/30 mt-3">
            Everyone in the workspace is already in this project.
          </p>
        )}
      </div>

      {/* Current members */}
      <div className="overflow-x-auto border border-white/8 rounded-2xl">
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
            {(activeProject.members || []).map((m) => {
              const u = m.user;
              const userId = u?._id;
              const busy = actingId === userId;
              return (
                <tr key={userId} className="border-t border-white/8 hover:bg-white/3">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 min-w-[220px]">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
                        {(u?.name?.[0] || u?.email?.[0] || "?").toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white/80 font-medium truncate">{u?.name || "—"}</p>
                        <p className="text-xs text-white/35 truncate">{projectRoleLabel(m.role)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white/60">{u?.email || "—"}</td>
                  <td className="px-4 py-3">
                    {canManage ? (
                      <select
                        value={m.role}
                        disabled={busy}
                        onChange={(e) => handleChangeRole(userId, e.target.value)}
                        className="text-xs rounded-md bg-white/5 border border-white/10 text-white/70 px-2 py-1 focus:outline-none focus:border-indigo-500/50 cursor-pointer disabled:opacity-60"
                      >
                        <option value="manager">Manager</option>
                        <option value="contributor">Contributor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <span className={`inline-flex px-2 py-1 rounded-full border text-xs ${projectRoleBadgeClass(m.role)}`}>
                        {projectRoleLabel(m.role)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canManage ? (
                      <button
                        disabled={busy}
                        onClick={() => handleRemove(userId)}
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

            {(activeProject.members || []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-white/30 text-sm">
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

