import api from "../../services/api";

export const getInviteInfo   = (token)           => api.get(`/invites/token/${token}`);
export const acceptInvite    = (token)           => api.post(`/invites/token/${token}/accept`);
export const sendInvite      = (data)            => api.post(`/invites/workspace`, data);
export const getWorkspaceInvites = (workspaceId) =>
  api.get(`/invites/workspace/${workspaceId}/pending`);
export const revokeInvite    = (inviteId)        => api.delete(`/invites/${inviteId}`);
