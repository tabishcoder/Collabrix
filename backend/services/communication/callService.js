/**
 * Unified entry for real-time calls (meetings + future chat voice/video).
 *
 * Future chat calls (not implemented): call createCall({ type: 'chat', maxParticipants: 5, ... })
 * and reuse acsService for ACS identities, groupId, and VoIP tokens — same pattern as meetings.
 */

const meetingService = require('./meetingService');

const CALL_TYPES = {
  CHAT: 'chat',
  MEETING: 'meeting',
};

function notImplementedChat() {
  const e = new Error('Chat calls are not implemented yet');
  e.statusCode = 501;
  e.code = 'CHAT_CALLS_NOT_IMPLEMENTED';
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
    throw notImplementedChat();
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
  if (type === CALL_TYPES.CHAT) throw notImplementedChat();
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
  if (type === CALL_TYPES.CHAT) throw notImplementedChat();
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
  if (type === CALL_TYPES.CHAT) throw notImplementedChat();
  throw Object.assign(new Error('Invalid call type'), { statusCode: 400 });
}

module.exports = {
  CALL_TYPES,
  createCall,
  joinCall,
  leaveCall,
  endCall,
};
