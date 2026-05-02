const MAX = 20;

function key(projectId) {
  return `collabrix:recentMeetings:${projectId || "none"}`;
}

/**
 * @param {string} projectId
 * @returns {Array<{ _id: string, title: string, status?: string, savedAt: string }>}
 */
export function loadRecentMeetings(projectId) {
  if (typeof window === "undefined" || !projectId) return [];
  try {
    const raw = window.sessionStorage.getItem(key(projectId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * @param {string} projectId
 * @param {{ _id: string, title: string, status?: string }} meeting
 */
export function pushRecentMeeting(projectId, meeting) {
  if (typeof window === "undefined" || !projectId || !meeting?._id) return;
  const id = String(meeting._id);
  const prev = loadRecentMeetings(projectId).filter((m) => m._id !== id);
  const row = {
    _id: id,
    title: meeting.title || "Meeting",
    status: meeting.status,
    savedAt: new Date().toISOString(),
  };
  const next = [row, ...prev].slice(0, MAX);
  try {
    window.sessionStorage.setItem(key(projectId), JSON.stringify(next));
  } catch {
    /* quota */
  }
}
