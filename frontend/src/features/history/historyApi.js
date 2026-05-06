import api from "../../services/api";

export const getProjectHistoryApi = (projectId) => api.get(`/history/project/${projectId}`);
