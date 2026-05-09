import api from "../../services/api";

export function listMeetingsForProjectApi(projectId) {
  return api.get("/meetings", { params: { projectId } });
}

export function createMeetingApi({ title, projectId }) {
  return api.post("/meetings/create", { title, projectId: projectId || undefined });
}

export function joinMeetingApi(meetingId) {
  return api.post(`/meetings/${meetingId}/join`);
}

export function leaveMeetingApi(meetingId) {
  return api.post(`/meetings/${meetingId}/leave`);
}

export function endMeetingApi(meetingId) {
  return api.post(`/meetings/${meetingId}/end`);
}

export function getMeetingByIdApi(meetingId) {
  return api.get(`/meetings/${meetingId}`);
}
