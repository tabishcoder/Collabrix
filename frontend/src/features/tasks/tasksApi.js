// src/features/tasks/tasksApi.js
import api from "../../services/api";

// GET /api/tasks/project/:projectId
export const fetchTasksByProjectApi = (projectId) =>
  api.get(`/tasks/project/${projectId}`);

// GET /api/tasks/:id (helper if you need it)
export const fetchTaskByIdApi = (taskId) => api.get(`/tasks/${taskId}`);

// POST /api/tasks
export const createTaskApi = (data) =>
  // backend doc expects projectId in body; make sure data contains projectId
  api.post("/tasks", data);

// PUT /api/tasks/:id
export const updateTaskApi = (taskId, data) =>
  api.put(`/tasks/${taskId}`, data);

// DELETE /api/tasks/:id
export const deleteTaskApi = (taskId) => api.delete(`/tasks/${taskId}`);

// POST /api/tasks/:id/comments
export const addTaskCommentApi = (taskId, text) =>
  api.post(`/tasks/${taskId}/comments`, { text });
