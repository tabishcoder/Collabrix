/**
 * Unified entry for real-time meetings.
 *
 * Chat voice uses the same ACS VoIP tokens via `POST /chats/:chatId/voice-call/start`
 * and `POST /meetings/:id/join` for refresh (`startOrGetChatVoiceMeeting`).
 */

const meetingService = require('./meetingService');

const CALL_TYPES = {
  CHAT: 'chat',
  MEETING: 'meeting',
};

function chatCallsViaHttp() {
  const e = new Error('Use POST /chats/:chatId/voice-call/start for chat voice calls');
  e.statusCode = 501;
  e.code = 'CHAT_CALLS_USE_HTTP';
  return e;
}

/**
 * @param {{ type: string, title?: string, projectId?: string|null }} params
 */
async function createCall(params) {
  const type = params?.type;
  if (type === CALL_TYPES.MEETING) {
    const userId = params.userId;
    if (!userId) throw Object.assign(new Error('userId is required'), { statusCode: 400 });
    return meetingService.createMeeting(userId, {
      title: params.title,
      projectId: params.projectId,
    });
  }
  if (type === CALL_TYPES.CHAT) {
    throw chatCallsViaHttp();
  }
  throw Object.assign(new Error('Invalid call type'), { statusCode: 400 });
}

async function joinCall(params) {
  const { type, meetingId, userId } = params || {};
  if (type === CALL_TYPES.MEETING) {
    if (!meetingId || !userId) {
      throw Object.assign(new Error('meetingId and userId are required'), { statusCode: 400 });
    }
    return meetingService.joinMeeting(meetingId, userId);
  }
  if (type === CALL_TYPES.CHAT) throw chatCallsViaHttp();
  throw Object.assign(new Error('Invalid call type'), { statusCode: 400 });
}

async function leaveCall(params) {
  const { type, meetingId, userId } = params || {};
  if (type === CALL_TYPES.MEETING) {
    if (!meetingId || !userId) {
      throw Object.assign(new Error('meetingId and userId are required'), { statusCode: 400 });
    }
    return meetingService.leaveMeeting(meetingId, userId);
  }
  if (type === CALL_TYPES.CHAT) throw chatCallsViaHttp();
  throw Object.assign(new Error('Invalid call type'), { statusCode: 400 });
}

async function endCall(params) {
  const { type, meetingId, userId } = params || {};
  if (type === CALL_TYPES.MEETING) {
    if (!meetingId || !userId) {
      throw Object.assign(new Error('meetingId and userId are required'), { statusCode: 400 });
    }
    return meetingService.endMeeting(meetingId, userId);
  }
  if (type === CALL_TYPES.CHAT) throw chatCallsViaHttp();
  throw Object.assign(new Error('Invalid call type'), { statusCode: 400 });
}

module.exports = {
  CALL_TYPES,
  createCall,
  joinCall,
  leaveCall,
  endCall,
};
