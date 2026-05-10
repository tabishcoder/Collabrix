const Project = require('../models/Project');
const aiClient = require('./aiClient');
const {
  emitMeetingTranscript,
  emitMeetingSummary,
} = require('./aiKnowledgeEvents');

/**
 * Persist transcript, summarize via FastAPI (chunked for long text), then ingest transcript + summary to RAG.
 * @param {import('mongoose').Document} m Meeting document (already validated)
 * @param {string} transcript
 * @param {string} allowedLang en | ur | mixed
 * @param {import('mongoose').Types.ObjectId} submittedByUserId
 * @param {'manual'|'whisper_local'} [transcriptSource]
 * @returns {Promise<{ aiSummaryWarning: string | null }>}
 */
async function runMeetingAiPipeline(
  m,
  transcript,
  allowedLang,
  submittedByUserId,
  transcriptSource = 'manual'
) {
  m.transcript = transcript;
  m.transcriptLanguage = allowedLang;
  m.transcriptSubmittedAt = new Date();
  m.transcriptSubmittedBy = submittedByUserId;
  m.transcriptSource = transcriptSource === 'whisper_local' ? 'whisper_local' : 'manual';
  m.aiSummary = '';
  m.aiActionItems = '';
  await m.save();

  const project = await Project.findById(m.projectId).populate('spaceId');
  let aiSummaryWarning = null;

  if (project && aiClient.isAiConfigured()) {
    // Summarize first (chunked in FastAPI for long text). Ingest to RAG after so the meeting
    // recap is stored on the meeting record immediately — no second “summarize” step in the AI bot.
    try {
      const sum = await aiClient.summarizeMeetingTranscript({
        text: transcript,
        language: allowedLang,
      });
      m.aiSummary = sum.summary || '';
      m.aiActionItems = sum.action_items || '';
      await m.save();
    } catch (e) {
      const detail = e.response?.data?.detail || e.response?.data?.message || e.message;
      console.error('[ai] meeting summarize failed:', detail);
      aiSummaryWarning =
        typeof detail === 'string'
          ? detail
          : 'AI summary failed; transcript was saved. Check AI_SERVICE_URL, AI_SERVICE_SECRET vs INTERNAL_API_SECRET, GOOGLE_API_KEY, and FastAPI logs.';
    }
    emitMeetingTranscript(project, m._id, m.title, transcript, allowedLang);
    if (m.aiSummary || m.aiActionItems) {
      emitMeetingSummary(project, m._id, m.title, m.aiSummary, m.aiActionItems);
    }
  } else if (!aiClient.isAiConfigured()) {
    aiSummaryWarning =
      'AI_SERVICE_URL is not set; transcript saved in MongoDB only (no summary or vector ingest).';
  }

  return { aiSummaryWarning };
}

module.exports = { runMeetingAiPipeline };
