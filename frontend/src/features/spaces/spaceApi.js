import api from "../../services/api";

export const getSpaces = () => api.get("/spaces");
export const createSpace = (data) => api.post("/spaces", data);
