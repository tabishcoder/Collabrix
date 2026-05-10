const aiClient = require('./aiClient');

function spaceIdFromProject(project) {
  if (!project?.spaceId) return null;
  const s = project.spaceId;
  return String(s._id || s);
}

function projectIdStr(project) {
  return String(project._id);
}

/**
 * Serialize a populated task (mongoose doc or plain) for embedding / retrieval.
 */
function formatTaskContent(task, project) {
  const t = task.toObject ? task.toObject() : task;
  const pid = t.projectId?._id ? t.projectId._id : t.projectId;
  const assignee = t.assignee;
  const assigneeName = assignee?.name || (assignee && String(assignee)) || 'unassigned';
  const comments = (t.comments || [])
    .map((c) => {
      const author = c.author?.name || 'user';
      return `- ${author}: ${(c.text || '').slice(0, 2000)}`;
    })
    .join('\n');

  const colName =
    project?.boardColumns?.find((c) => c.key === t.status)?.name || t.status;

  const lines = [
    `Task: ${t.title}`,
    `Description: ${(t.description || '').slice(0, 8000)}`,
    `Status (column): ${colName} (${t.status})`,
    `Priority: ${t.priority || 'none'}`,
    `Due: ${t.dueDate ? new Date(t.dueDate).toISOString() : 'none'}`,
    `Labels: ${(t.labels || []).join(', ') || 'none'}`,
    `Assignee: ${assigneeName}`,
    `Task ID: ${t._id}`,
  ];
  if (comments) {
    lines.push('Comments:', comments);
  }
  return lines.join('\n');
}

function fireIngest(payload) {
  void aiClient.ingestEvent(payload).catch(() => {});
}

/**
 * @param {object} params
 * @param {string} params.event_type
 * @param {import('mongoose').Document} params.project mongoose project (with spaceId)
 * @param {string} params.content_type
 * @param {string} [params.source_id]
 * @param {string} [params.title]
 * @param {string} params.content
 */
function emitKnowledge({ event_type, project, content_type, source_id, title, content }) {
  if (!aiClient.isAiConfigured()) return;
  const workspace_id = spaceIdFromProject(project);
  if (!workspace_id || !project?._id) return;

  fireIngest({
    event_type,
    workspace_id,
    project_id: projectIdStr(project),
    content_type,
    source_id: source_id || null,
    title: title || null,
    content: String(content).slice(0, 32000),
    timestamp: new Date().toISOString(),
    metadata: null,
  });
}

function emitTaskCreated(project, taskDoc) {
  const title = taskDoc.title || 'Task';
  emitKnowledge({
    event_type: 'TASK_CREATED',
    project,
    content_type: 'task',
    source_id: String(taskDoc._id),
    title,
    content: formatTaskContent(taskDoc, project),
  });
}

function emitTaskUpdated(project, taskDoc) {
  const title = taskDoc.title || 'Task';
  emitKnowledge({
    event_type: 'TASK_UPDATED',
    project,
    content_type: 'task',
    source_id: String(taskDoc._id),
    title,
    content: formatTaskContent(taskDoc, project),
  });
}

function emitTaskCommentAdded(project, taskDoc, commentPreview) {
  const title = taskDoc.title || 'Task';
  emitKnowledge({
    event_type: 'TASK_COMMENT_ADDED',
    project,
    content_type: 'task',
    source_id: String(taskDoc._id),
    title,
    content: `${formatTaskContent(taskDoc, project)}\n\nLatest comment: ${commentPreview}`,
  });
}

function emitBoardActivity(project, description, source_id) {
  emitKnowledge({
    event_type: 'BOARD_ACTIVITY',
    project,
    content_type: 'board',
    source_id: source_id || projectIdStr(project),
    title: project.name ? `Board: ${project.name}` : 'Board activity',
    content: description,
  });
}

function emitMeetingTranscript(project, meetingId, title, transcript, language) {
  emitKnowledge({
    event_type: 'MEETING_TRANSCRIPT_SUBMITTED',
    project,
    content_type: 'meeting',
    source_id: String(meetingId),
    title: title || 'Meeting transcript',
    content: `Language: ${language || 'en'}\n\n${transcript.slice(0, 32000)}`,
  });
}

function emitMeetingSummary(project, meetingId, title, summary, actionItems) {
  emitKnowledge({
    event_type: 'MEETING_SUMMARY',
    project,
    content_type: 'meeting',
    source_id: String(meetingId),
    title: title ? `Summary: ${title}` : 'Meeting summary',
    content: `Summary:\n${summary}\n\nAction items:\n${actionItems}`,
  });
}

module.exports = {
  formatTaskContent,
  emitTaskCreated,
  emitTaskUpdated,
  emitTaskCommentAdded,
  emitBoardActivity,
  emitMeetingTranscript,
  emitMeetingSummary,
};

// Future: DOCUMENT_UPLOADED — call emitKnowledge when a shared document model and upload API exist.
