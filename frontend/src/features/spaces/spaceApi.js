import api from "../../services/api";

export const getSpaces    = ()           => api.get("/spaces");
export const createSpace  = (data)       => api.post("/spaces", data);
export const getSpaceById = (id)         => api.get(`/spaces/${id}`);
export const updateSpace  = (id, data)   => api.put(`/spaces/${id}`, data);

// Members
export const getSpaceMembers       = (id)              => api.get(`/spaces/${id}/members`);
export const addSpaceMember        = (id, data)        => api.post(`/spaces/${id}/members`, data);
export const updateSpaceMemberRole = (id, userId, role) =>
  api.put(`/spaces/${id}/members/${userId}/role`, { role });
export const removeSpaceMember     = (id, userId)      => api.delete(`/spaces/${id}/members/${userId}`);
