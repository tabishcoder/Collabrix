import api from "../../services/api";

// 1. Get all projects in a space
export const getProjectsBySpaceApi = (spaceId) =>
  api.get(`/projects/space/${spaceId}`);

// 2. Get single project
export const getProjectByIdApi = (projectId) =>
  api.get(`/projects/${projectId}`);

// 3. Create project
export const createProjectApi = (data) => api.post("/projects", data);

// 4. Update project
export const updateProjectApi = (projectId, data) =>
  api.put(`/projects/${projectId}`, data);

// 5. Delete project
export const deleteProjectApi = (projectId) =>
  api.delete(`/projects/${projectId}`);

// 6. Add project member
export const addProjectMemberApi = (projectId, userId) =>
  api.post(`/projects/${projectId}/members`, { userId });

// 7. Remove project member
export const removeProjectMemberApi = (projectId, userId) =>
  api.delete(`/projects/${projectId}/members/${userId}`);
