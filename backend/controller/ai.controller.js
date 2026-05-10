const { getProjectRole } = require('../utils/rbac');
const aiClient = require('../services/aiClient');

/**
 * Any project member (including viewer) may ask the workspace AI.
 */
module.exports.queryWorkspace = async (req, res) => {
  try {
    const query = (req.body?.query || '').trim();
    if (!query) {
      return res.status(400).json({ message: 'query is required' });
    }

    const projectId = req.body?.projectId;
    if (!projectId) {
      return res.status(400).json({ message: 'projectId is required' });
    }

    const { role, project } = await getProjectRole(projectId, req.user._id);
    if (!role) {
      return res.status(403).json({ message: 'Access denied for this project' });
    }

    if (!aiClient.isAiConfigured()) {
      return res.status(503).json({ message: 'AI service is not configured (AI_SERVICE_URL)' });
    }

    const spaceId = project.spaceId?._id ? project.spaceId._id : project.spaceId;
    const top_k = req.body?.top_k;
    const body = {
      query,
      workspace_id: String(spaceId),
      project_id: String(project._id),
      ...(typeof top_k === 'number' && top_k > 0 ? { top_k: Math.min(50, top_k) } : {}),
    };

    const data = await aiClient.queryRag(body);
    return res.json(data);
  } catch (err) {
    const status = err.response?.status || err.statusCode || 500;
    const message = err.response?.data?.detail || err.response?.data?.message || err.message || 'AI query failed';
    if (status >= 500) console.error('[ai] query:', message);
    return res.status(status >= 400 && status < 600 ? status : 500).json({ message: String(message) });
  }
};

/**
 * One-off summarization of arbitrary text (e.g. pasted notes). Same project gate as query.
 */
module.exports.summarizeText = async (req, res) => {
  try {
    const text = (req.body?.text || '').trim();
    if (!text) {
      return res.status(400).json({ message: 'text is required' });
    }
    const projectId = req.body?.projectId;
    if (!projectId) {
      return res.status(400).json({ message: 'projectId is required' });
    }

    const { role } = await getProjectRole(projectId, req.user._id);
    if (!role) {
      return res.status(403).json({ message: 'Access denied for this project' });
    }

    if (!aiClient.isAiConfigured()) {
      return res.status(503).json({ message: 'AI service is not configured (AI_SERVICE_URL)' });
    }

    const data = await aiClient.summarizeMeetingTranscript({
      text,
      language: req.body?.language || null,
    });
    return res.json(data);
  } catch (err) {
    const status = err.response?.status || err.statusCode || 500;
    const message = err.response?.data?.detail || err.response?.data?.message || err.message || 'Summarize failed';
    if (status >= 500) console.error('[ai] summarize:', message);
    return res.status(status >= 400 && status < 600 ? status : 500).json({ message: String(message) });
  }
};
