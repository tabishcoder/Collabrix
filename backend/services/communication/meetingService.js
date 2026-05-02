const crypto = require('crypto');
const mongoose = require('mongoose');
const Meeting = require('../../models/Meeting');
const Project = require('../../models/Project');
const acsService = require('./acsService');

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

/**
 * Link-style access: host, anyone who ever participated, or meeting still active.
 */
function canReadMeeting(meeting, userId) {
  const uid = userId.toString();
  if (meeting.createdBy.toString() === uid) return true;
  if (meeting.status === 'active') return true;
  return meeting.participants.some((p) => p.user.toString() === uid);
}

function getActiveParticipantEntry(meeting, userId) {
  const uid = userId.toString();
  return meeting.participants.find((p) => p.user.toString() === uid && !p.leftAt);
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
 * @param {string} meetingId
 * @param {import('mongoose').Types.ObjectId} userId
 */
async function joinMeeting(meetingId, userId) {
  if (!isValidObjectId(meetingId)) throw err('Invalid meeting id');

  const meeting = await Meeting.findById(meetingId);
  if (!meeting) throw err('Meeting not found', 404);
  if (meeting.status !== 'active') throw err('Meeting has ended', 400);

  const uid = userId.toString();
  const isHost = meeting.createdBy.toString() === uid;

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
  if (meeting.createdBy.toString() !== userId.toString()) {
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
  if (!canReadMeeting(meeting, userId)) throw err('Forbidden', 403);

  const obj = meeting.toObject({ virtuals: false });
  obj.participants = buildParticipantPayload(meeting);
  return { meeting: obj };
}

/**
 * Used by Socket.IO to authorize `join-meeting` room subscription.
 */
async function userMaySubscribeMeetingRoom(meetingId, userId) {
  if (!isValidObjectId(meetingId)) return false;
  const meeting = await Meeting.findById(meetingId).select('status createdBy participants');
  if (!meeting) return false;
  return canReadMeeting(meeting, userId);
}

module.exports = {
  createMeeting,
  joinMeeting,
  leaveMeeting,
  endMeeting,
  getMeetingById,
  userMaySubscribeMeetingRoom,
  buildParticipantPayload,
};
