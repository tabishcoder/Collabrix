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

export function patchMeetingTranscriptApi(meetingId, body) {
  return api.patch(`/meetings/${meetingId}/transcript`, body);
}

/** multipart field name: `audio` — Node proxies to local faster-whisper */
export function uploadMeetingAudioApi(meetingId, blob, language) {
  const fd = new FormData();
  fd.append("audio", blob, "recording.webm");
  return api.post(`/meetings/${meetingId}/audio`, fd, {
    params: language ? { language } : {},
    timeout: 600000,
  });
}
