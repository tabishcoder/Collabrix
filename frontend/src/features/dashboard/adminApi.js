import api from "../../services/api";

export const getAdminOverviewApi = () => api.get("/admin/overview");
