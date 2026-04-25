import api from "../../services/api";

export const fetchNotificationsApi = () => api.get("/notifications");

export const markNotificationReadApi = (id) => api.patch(`/notifications/${id}/read`);

export const markAllNotificationsReadApi = () => api.post("/notifications/read-all");
