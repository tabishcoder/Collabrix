import api from "../../services/api";

export const searchWorkspaceApi = (spaceId, q) =>
  api.get("/search", { params: { spaceId, q } });
