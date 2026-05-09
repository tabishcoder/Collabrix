const crypto = require('crypto');
const mongoose = require('mongoose');
const Meeting = require('../../models/Meeting');
const Project = require('../../models/Project');
const Chat = require('../../models/Chat');
const acsService = require('./acsService');
const { userCanAccessChat } = require('../chatService');
const { getProjectRole } = require('../../utils/rbac');

/**
 * User may create/join meetings scoped to a project if they belong to the space or project.
 */
async function assertUserCanAccessProject(projectId, userId) {
  const project = await Project.findById(projectId).populate('spaceId');
  if (!project || !project.spaceId) {
    const e = new Error('Project not found');
    e.statusCode = 404;
    throw e;
  }
  const space = project.spaceId;
  const uid = userId.toString();
  if (space.owner && space.owner.toString() === uid) return;
  if (Array.isArray(space.members) && space.members.some((m) => m.toString() === uid)) return;
  if (Array.isArray(project.members) && project.members.some((m) => m.toString() === uid)) return;

  const e = new Error('Access denied for this project');
  e.statusCode = 403;
  throw e;
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function err(message, statusCode = 400) {
  const e = new Error(message);
  e.statusCode = statusCode;
  return e;
}

function refUserId(ref) {
  if (!ref) return '';
  if (ref._id) return ref._id.toString();
  return ref.toString();
}

/**
 * Link-style access: host, anyone who ever participated, or meeting still active.
 */
function canReadMeeting(meeting, userId) {
  const uid = userId.toString();
  if (refUserId(meeting.createdBy) === uid) return true;
  if (meeting.status === 'active') return true;
  return meeting.participants.some((p) => refUserId(p.user) === uid);
}

function getActiveParticipantEntry(meeting, userId) {
  const uid = userId.toString();
  return meeting.participants.find((p) => refUserId(p.user) === uid && !p.leftAt);
}

function buildParticipantPayload(meeting) {
  const parts = meeting?.participants || [];
  const present = parts.filter((p) => !p.leftAt);
  return present.map((p) => ({
    user: p.user,
    role: p.role,
    joinedAt: p.joinedAt,
  }));
}

/** Full roster with leave times — used by GET meeting detail (past sessions). */
function buildDetailParticipantPayload(meeting) {
  const parts = meeting?.participants || [];
  return parts.map((p) => ({
    user: p.user,
    role: p.role,
    joinedAt: p.joinedAt,
    leftAt: p.leftAt ?? null,
  }));
}

async function issueAcs(userId) {
  return acsService.getTokenForUser(userId);
}

/**
 * @param {import('mongoose').Types.ObjectId} userId
 * @param {{ title: string, projectId?: string|null }} input
 */
async function createMeeting(userId, input) {
  const { title, projectId } = input;
  if (!title || !String(title).trim()) throw err('Title is required');

  if (projectId) {
    if (!isValidObjectId(projectId)) throw err('Invalid projectId');
    await assertUserCanAccessProject(projectId, userId);
  }

  const groupId = crypto.randomUUID();
  const now = new Date();

  const meeting = await Meeting.create({
    title: String(title).trim(),
    createdBy: userId,
    projectId: projectId || null,
    chatId: null,
    callKind: 'meeting',
    groupId,
    status: 'active',
    participants: [
      {
        user: userId,
        role: 'host',
        joinedAt: now,
        leftAt: null,
      },
    ],
  });

  const acs = await issueAcs(userId);
  const populated = await Meeting.findById(meeting._id)
    .populate('createdBy', '_id name email')
    .populate('participants.user', '_id name email')
    .lean();

  return { meeting: populated, acs };
}

/**
 * Start or return an active Azure group call for a chat (voice-only in the UI).
 * One active chat_voice meeting per chat at a time.
 *
 * @param {import('mongoose').Types.ObjectId} userId
 * @param {string} chatId
 */
async function startOrGetChatVoiceMeeting(userId, chatId) {
  if (!isValidObjectId(chatId)) throw err('Invalid chat id');

  const chat = await Chat.findById(chatId);
  if (!chat) throw err('Chat not found', 404);
  if (!(await userCanAccessChat(userId, chat))) throw err('Forbidden', 403);

  let meeting = await Meeting.findOne({
    chatId: chat._id,
    callKind: 'chat_voice',
    status: 'active',
  });

  const reused = Boolean(meeting);

  if (!meeting) {
    const groupId = crypto.randomUUID();
    const now = new Date();
    meeting = await Meeting.create({
      title: 'Voice call',
      createdBy: userId,
      projectId: chat.projectId || null,
      chatId: chat._id,
      callKind: 'chat_voice',
      groupId,
      status: 'active',
      participants: [
        {
          user: userId,
          role: 'host',
          joinedAt: now,
          leftAt: null,
        },
      ],
    });
  } else if (!getActiveParticipantEntry(meeting, userId)) {
    meeting.participants.push({
      user: userId,
      role: refUserId(meeting.createdBy) === userId.toString() ? 'host' : 'participant',
      joinedAt: new Date(),
      leftAt: null,
    });
    await meeting.save();
  }

  const acs = await issueAcs(userId);
  await meeting.populate('createdBy', '_id name email');
  await meeting.populate('participants.user', '_id name email');

  return {
    meeting: meeting.toObject({ virtuals: false }),
    acs,
    reused,
  };
}

/**
 * @param {string} meetingId
 * @param {import('mongoose').Types.ObjectId} userId
 */
async function joinMeeting(meetingId, userId) {
  if (!isValidObjectId(meetingId)) throw err('Invalid meeting id');

  const meeting = await Meeting.findById(meetingId);
  if (!meeting) throw err('Meeting not found', 404);
  if (meeting.status !== 'active') throw err('Meeting has ended', 400);

  if (meeting.callKind === 'chat_voice' && meeting.chatId) {
    const chat = await Chat.findById(meeting.chatId);
    if (!chat || !(await userCanAccessChat(userId, chat))) throw err('Forbidden', 403);
  }

  const uid = userId.toString();
  const isHost = refUserId(meeting.createdBy) === uid;

  if (getActiveParticipantEntry(meeting, userId)) {
    const acs = await issueAcs(userId);
    await meeting.populate('createdBy', '_id name email');
    await meeting.populate('participants.user', '_id name email');
    return {
      meeting: meeting.toObject({ virtuals: false }),
      acs,
      alreadyPresent: true,
    };
  }

  if (!isHost) {
    meeting.participants.push({
      user: userId,
      role: 'participant',
      joinedAt: new Date(),
      leftAt: null,
    });
  } else {
    meeting.participants.push({
      user: userId,
      role: 'host',
      joinedAt: new Date(),
      leftAt: null,
    });
  }

  await meeting.save();
  const acs = await issueAcs(userId);
  await meeting.populate('createdBy', '_id name email');
  await meeting.populate('participants.user', '_id name email');

  return {
    meeting: meeting.toObject({ virtuals: false }),
    acs,
    alreadyPresent: false,
  };
}

/**
 * @param {string} meetingId
 * @param {import('mongoose').Types.ObjectId} userId
 */
async function leaveMeeting(meetingId, userId) {
  if (!isValidObjectId(meetingId)) throw err('Invalid meeting id');

  const meeting = await Meeting.findById(meetingId);
  if (!meeting) throw err('Meeting not found', 404);

  const entry = getActiveParticipantEntry(meeting, userId);
  if (!entry) throw err('Not currently in this meeting', 400);

  entry.leftAt = new Date();
  await meeting.save();

  await meeting.populate('createdBy', '_id name email');
  await meeting.populate('participants.user', '_id name email');

  return { meeting: meeting.toObject({ virtuals: false }) };
}

/**
 * @param {string} meetingId
 * @param {import('mongoose').Types.ObjectId} userId
 */
async function endMeeting(meetingId, userId) {
  if (!isValidObjectId(meetingId)) throw err('Invalid meeting id');

  const meeting = await Meeting.findById(meetingId);
  if (!meeting) throw err('Meeting not found', 404);
  if (refUserId(meeting.createdBy) !== userId.toString()) {
    throw err('Only the host can end the meeting', 403);
  }
  if (meeting.status === 'ended') throw err('Meeting already ended', 400);

  const now = new Date();
  meeting.participants.forEach((p) => {
    if (!p.leftAt) p.leftAt = now;
  });
  meeting.status = 'ended';
  meeting.endedAt = now;
  await meeting.save();

  await meeting.populate('createdBy', '_id name email');
  await meeting.populate('participants.user', '_id name email');

  return { meeting: meeting.toObject({ virtuals: false }) };
}

/**
 * @param {string} meetingId
 * @param {import('mongoose').Types.ObjectId} userId
 */
async function getMeetingById(meetingId, userId) {
  if (!isValidObjectId(meetingId)) throw err('Invalid meeting id');

  const meeting = await Meeting.findById(meetingId)
    .populate('createdBy', '_id name email')
    .populate('participants.user', '_id name email');

  if (!meeting) throw err('Meeting not found', 404);

  if (meeting.callKind === 'chat_voice' && meeting.chatId) {
    const chat = await Chat.findById(meeting.chatId);
    if (!chat || !(await userCanAccessChat(userId, chat))) throw err('Forbidden', 403);
  } else if (canReadMeeting(meeting, userId)) {
    /* ok — host, participant history, or room still active */
  } else if (meeting.projectId) {
    const { role } = await getProjectRole(meeting.projectId, userId);
    if (!role) throw err('Forbidden', 403);
  } else {
    throw err('Forbidden', 403);
  }

  const obj = meeting.toObject({ virtuals: false });
  obj.participants = buildDetailParticipantPayload(meeting);
  return { meeting: obj };
}

/**
 * Used by Socket.IO to authorize `join-meeting` room subscription.
 */
/**
 * List meetings tied to a project (for sidebar). Caller must have project access.
 */
async function listMeetingsForProject(projectId, userId) {
  if (!isValidObjectId(projectId)) throw err('Invalid project id');

  const { role } = await getProjectRole(projectId, userId);
  if (!role) throw err('Access denied', 403);

  const pid = new mongoose.Types.ObjectId(projectId);
  const meetings = await Meeting.find({
    projectId: pid,
    callKind: { $ne: 'chat_voice' },
  })
    .sort({ updatedAt: -1 })
    .limit(100)
    .populate('createdBy', '_id name email')
    .select('title status projectId chatId callKind createdBy endedAt createdAt updatedAt participants')
    .lean();

  return meetings.map((m) => ({
    _id: m._id,
    title: m.title,
    status: m.status,
    projectId: m.projectId,
    chatId: m.chatId ?? null,
    callKind: m.callKind || 'meeting',
    createdBy: m.createdBy,
    endedAt: m.endedAt,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
    activeParticipants: (m.participants || []).filter((p) => !p.leftAt).length,
  }));
}

async function userMaySubscribeMeetingRoom(meetingId, userId) {
  if (!isValidObjectId(meetingId)) return false;
  const meeting = await Meeting.findById(meetingId).select(
    'status createdBy participants callKind chatId projectId',
  );
  if (!meeting) return false;
  if (meeting.callKind === 'chat_voice' && meeting.chatId) {
    const chat = await Chat.findById(meeting.chatId);
    return Boolean(chat && (await userCanAccessChat(userId, chat)));
  }
  if (canReadMeeting(meeting, userId)) return true;
  if (meeting.projectId) {
    const { role } = await getProjectRole(meeting.projectId, userId);
    return Boolean(role);
  }
  return false;
}

module.exports = {
  createMeeting,
  startOrGetChatVoiceMeeting,
  joinMeeting,
  leaveMeeting,
  endMeeting,
  getMeetingById,
  listMeetingsForProject,
  userMaySubscribeMeetingRoom,
  buildParticipantPayload,
  buildDetailParticipantPayload,
};
