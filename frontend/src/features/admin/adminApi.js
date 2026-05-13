import api from "../../services/api";

export const getAdminOverviewApi = () => api.get("/admin/overview");
export const getAdminStatsApi = () => api.get("/admin/stats");
export const getAdminUsersApi = (params) => api.get("/admin/users", { params });
export const patchAdminUserApi = (id, data) => api.patch(`/admin/users/${id}`, data);
export const getAdminWorkspacesApi = () => api.get("/admin/workspaces");
export const getAdminWorkspaceApi = (id) => api.get(`/admin/workspaces/${id}`);
export const getAdminAnalyticsApi = (params) => api.get("/admin/analytics", { params });
