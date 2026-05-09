import api from "../../services/api";

export const fetchActiveTimerApi = () => api.get("/time-entries/active");

export const fetchTimeEntriesByTaskApi = (taskId) =>
  api.get(`/time-entries/task/${taskId}`);

export const startTimerApi = (taskId) =>
  api.post("/time-entries/start", { taskId });

export const stopTimerApi = (taskId) =>
  api.post("/time-entries/stop", taskId ? { taskId } : {});

export const createManualTimeEntryApi = (payload) =>
  api.post("/time-entries/manual", payload);

export const updateTimeEntryApi = (entryId, payload) =>
  api.patch(`/time-entries/${entryId}`, payload);

export const deleteTimeEntryApi = (entryId) =>
  api.delete(`/time-entries/${entryId}`);
