const Meeting = require('../models/Meeting');
const meetingService = require('../services/communication/meetingService');
const { getProjectRole, PROJECT_MANAGE_ROLES } = require('../utils/rbac');
const aiClient = require('../services/aiClient');
const { runMeetingAiPipeline } = require('../services/meetingAiPipeline');

const getIO = (req) => req.app.get('io');

function refUserId(ref) {
  if (!ref) return '';
  if (ref._id) return ref._id.toString();
  return ref.toString();
}

function userSocketPayload(user) {
  if (!user) return null;
  return { _id: user._id, name: user.name, email: user.email };
}

function meetingSummaryForSocket(m) {
  const meeting = m.toObject ? m.toObject({ virtuals: false }) : m;
  return {
    meetingId: String(meeting._id),
    title: meeting.title,
    status: meeting.status,
    groupId: meeting.groupId,
    projectId: meeting.projectId,
    chatId: meeting.chatId ?? null,
    callKind: meeting.callKind || 'meeting',
    createdBy: meeting.createdBy,
    participants: meetingService.buildParticipantPayload({ participants: meeting.participants || [] }),
  };
}

function meetingJsonBody(m) {
  const meeting = m.toObject ? m.toObject({ virtuals: false }) : m;
  return {
    _id: meeting._id,
    title: meeting.title,
    status: meeting.status,
    groupId: meeting.groupId,
    projectId: meeting.projectId,
    chatId: meeting.chatId ?? null,
    callKind: meeting.callKind || 'meeting',
    createdBy: meeting.createdBy,
    participants: meetingService.buildDetailParticipantPayload(m),
    endedAt: meeting.endedAt,
    createdAt: meeting.createdAt,
    updatedAt: meeting.updatedAt,
    transcript: meeting.transcript || '',
    transcriptLanguage: meeting.transcriptLanguage || 'en',
    aiSummary: meeting.aiSummary || '',
    aiActionItems: meeting.aiActionItems || '',
    transcriptSubmittedAt: meeting.transcriptSubmittedAt || null,
    transcriptSubmittedBy: meeting.transcriptSubmittedBy || null,
    transcriptSource: meeting.transcriptSource || 'manual',
  };
}

async function assertMeetingTranscriptAccess(meetingDoc, userId) {
  if (meetingDoc.callKind === 'chat_voice') {
    const err = new Error('Transcripts are not stored for chat voice calls (privacy).');
    err.statusCode = 403;
    throw err;
  }
  if (!meetingDoc.projectId) {
    const err = new Error(
      'Meeting must be linked to a project to attach a transcript for the workspace AI.'
    );
    err.statusCode = 400;
    throw err;
  }
  const uid = userId.toString();
  const isHost = refUserId(meetingDoc.createdBy) === uid;
  const { role } = await getProjectRole(meetingDoc.projectId, userId);
  const canManage = PROJECT_MANAGE_ROLES.includes(role);
  if (!isHost && !canManage) {
    const err = new Error('Only the meeting host or a project manager can submit a transcript.');
    err.statusCode = 403;
    throw err;
  }
}

function formatUpstreamAiError(e) {
  const d = e.response?.data?.detail;
  if (typeof d === 'string') return d;
  if (Array.isArray(d)) return d.map((x) => (typeof x === 'object' ? x.msg || JSON.stringify(x) : String(x))).join('; ');
  return e.response?.data?.message || e.message || 'Upstream AI error';
}

module.exports.createMeeting = async (req, res) => {
  try {
    const { title, projectId } = req.body;
    const { meeting, acs } = await meetingService.createMeeting(req.user._id, { title, projectId });

    const io = getIO(req);
    const meetingId = String(meeting._id);
    if (io) {
      io.to(`meeting-${meetingId}`).emit('meeting:started', {
        meetingId,
        user: userSocketPayload(req.user),
        meeting: meetingSummaryForSocket(meeting),
      });
    }

    return res.status(201).json({
      meeting: meetingJsonBody(meeting),
      acs: {
        groupId: meeting.groupId,
        communicationUserId: acs.communicationUserId,
        token: acs.token,
        expiresOn: acs.expiresOn,
      },
    });
  } catch (e) {
    const status = e.statusCode || 500;
    if (status >= 500) console.error(e);
    return res.status(status).json({ message: e.message || 'Server error' });
  }
};

module.exports.joinMeeting = async (req, res) => {
  try {
    const { meeting, acs, alreadyPresent } = await meetingService.joinMeeting(req.params.id, req.user._id);

    const io = getIO(req);
    const meetingId = String(meeting._id);
    if (io) {
      io.to(`meeting-${meetingId}`).emit('meeting:user-joined', {
        meetingId,
        user: userSocketPayload(req.user),
        alreadyPresent: !!alreadyPresent,
        meeting: meetingSummaryForSocket(meeting),
      });
    }

    return res.json({
      meeting: meetingJsonBody(meeting),
      acs: {
        groupId: meeting.groupId,
        communicationUserId: acs.communicationUserId,
        token: acs.token,
        expiresOn: acs.expiresOn,
      },
    });
  } catch (e) {
    const status = e.statusCode || 500;
    if (status >= 500) console.error(e);
    return res.status(status).json({ message: e.message || 'Server error' });
  }
};

module.exports.leaveMeeting = async (req, res) => {
  try {
    const { meeting } = await meetingService.leaveMeeting(req.params.id, req.user._id);

    const io = getIO(req);
    const meetingId = String(meeting._id);
    if (io) {
      io.to(`meeting-${meetingId}`).emit('meeting:user-left', {
        meetingId,
        user: userSocketPayload(req.user),
        meeting: meetingSummaryForSocket(meeting),
      });
    }

    return res.json({ meeting: meetingJsonBody(meeting) });
  } catch (e) {
    const status = e.statusCode || 500;
    if (status >= 500) console.error(e);
    return res.status(status).json({ message: e.message || 'Server error' });
  }
};

module.exports.endMeeting = async (req, res) => {
  try {
    const { meeting } = await meetingService.endMeeting(req.params.id, req.user._id);

    const io = getIO(req);
    const meetingId = String(meeting._id);
    const chatId = meeting.chatId ? String(meeting.chatId) : null;
    const callKind = meeting.callKind || 'meeting';
    if (io) {
      io.to(`meeting-${meetingId}`).emit('meeting:ended', {
        meetingId,
        user: userSocketPayload(req.user),
        meeting: meetingSummaryForSocket(meeting),
      });
      if (callKind === 'chat_voice' && chatId) {
        io.to(`chat-${chatId}`).emit('chat:voice-call-ended', { chatId, meetingId });
      }
    }

    return res.json({ meeting: meetingJsonBody(meeting) });
  } catch (e) {
    const status = e.statusCode || 500;
    if (status >= 500) console.error(e);
    return res.status(status).json({ message: e.message || 'Server error' });
  }
};

module.exports.getMeetingById = async (req, res) => {
  try {
    const { meeting } = await meetingService.getMeetingById(req.params.id, req.user._id);
    return res.json({ meeting });
  } catch (e) {
    const status = e.statusCode || 500;
    if (status >= 500) console.error(e);
    return res.status(status).json({ message: e.message || 'Server error' });
  }
};

module.exports.listMeetingsForProject = async (req, res) => {
  try {
    const projectId = req.query.projectId;
    if (!projectId) {
      return res.status(400).json({ message: 'projectId query parameter is required' });
    }
    const meetings = await meetingService.listMeetingsForProject(projectId, req.user._id);
    return res.json({ meetings });
  } catch (e) {
    const status = e.statusCode || 500;
    if (status >= 500) console.error(e);
    return res.status(status).json({ message: e.message || 'Server error' });
  }
};

/**
 * Submit or replace meeting transcript (project meetings only). Ingests to AI + generates summary.
 * Not allowed for chat_voice (private channel calls).
 */
module.exports.patchMeetingTranscript = async (req, res) => {
  try {
    await meetingService.getMeetingById(req.params.id, req.user._id);

    const m = await Meeting.findById(req.params.id);
    if (!m) return res.status(404).json({ message: 'Meeting not found' });

    try {
      await assertMeetingTranscriptAccess(m, req.user._id);
    } catch (err) {
      const status = err.statusCode || 500;
      return res.status(status).json({ message: err.message || 'Forbidden' });
    }

    const transcript = (req.body?.transcript ?? '').trim();
    if (!transcript) {
      return res.status(400).json({ message: 'transcript is required' });
    }

    const lang = req.body?.language;
    const allowedLang = ['en', 'ur', 'mixed'].includes(lang) ? lang : 'en';

    const { aiSummaryWarning } = await runMeetingAiPipeline(
      m,
      transcript,
      allowedLang,
      req.user._id,
      'manual'
    );

    const fresh = await Meeting.findById(m._id)
      .populate('createdBy', '_id name email')
      .populate('participants.user', '_id name email')
      .populate('transcriptSubmittedBy', '_id name email');
    const body = { meeting: meetingJsonBody(fresh) };
    if (aiSummaryWarning) body.aiSummaryWarning = aiSummaryWarning;
    return res.json(body);
  } catch (e) {
    const status = e.statusCode || 500;
    if (status >= 500) console.error(e);
    return res.status(status).json({ message: e.message || 'Server error' });
  }
};

/**
 * Upload meeting audio → FastAPI faster-whisper (local, free) → same ingest + summary pipeline as PATCH transcript.
 * multipart field name: `audio`
 */
module.exports.uploadMeetingAudio = async (req, res) => {
  try {
    await meetingService.getMeetingById(req.params.id, req.user._id);

    const m = await Meeting.findById(req.params.id);
    if (!m) return res.status(404).json({ message: 'Meeting not found' });

    try {
      await assertMeetingTranscriptAccess(m, req.user._id);
    } catch (err) {
      const status = err.statusCode || 500;
      return res.status(status).json({ message: err.message || 'Forbidden' });
    }

    if (!req.file?.buffer) {
      return res.status(400).json({ message: 'audio file is required (multipart field name: audio)' });
    }
    if (!aiClient.isAiConfigured()) {
      return res.status(503).json({
        message: 'AI_SERVICE_URL is not set; cannot reach the transcription service.',
      });
    }

    const langQ = (req.query?.language || '').trim();
    const allowedLang = ['en', 'ur', 'mixed'].includes(langQ) ? langQ : 'en';
    const whisperLang = allowedLang === 'mixed' ? null : allowedLang;

    let text;
    try {
      const out = await aiClient.transcribeMeetingAudioMultipart({
        buffer: req.file.buffer,
        filename: req.file.originalname || 'recording.webm',
        contentType: req.file.mimetype || 'application/octet-stream',
        language: whisperLang,
      });
      text = (out?.text || '').trim();
    } catch (e) {
      console.error('[ai] transcribe failed:', formatUpstreamAiError(e));
      const upstream = e.response?.status;
      const code = upstream >= 400 && upstream < 600 ? upstream : 502;
      return res.status(code).json({
        message: formatUpstreamAiError(e),
      });
    }

    if (!text) {
      return res.status(422).json({ message: 'Transcription returned no text' });
    }

    const { aiSummaryWarning } = await runMeetingAiPipeline(
      m,
      text,
      allowedLang,
      req.user._id,
      'whisper_local'
    );

    const fresh = await Meeting.findById(m._id)
      .populate('createdBy', '_id name email')
      .populate('participants.user', '_id name email')
      .populate('transcriptSubmittedBy', '_id name email');
    const body = { meeting: meetingJsonBody(fresh) };
    if (aiSummaryWarning) body.aiSummaryWarning = aiSummaryWarning;
    return res.json(body);
  } catch (e) {
    if (e.name === 'MulterError' && e.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'Audio file too large' });
    }
    const status = e.statusCode || 500;
    if (status >= 500) console.error(e);
    return res.status(status).json({ message: e.message || 'Server error' });
  }
};
