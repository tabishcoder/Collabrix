const mongoose = require('mongoose');
const Chat = require('../models/Chat');
const UserChatState = require('../models/UserChatState');
const Project = require('../models/Project');
const { getProjectRole } = require('../utils/rbac');

function toIdString(x) {
  if (!x) return '';
  return x._id ? x._id.toString() : String(x);
}

/** Sorted pair key for two users (without project scope). */
function directPairKey(userIdA, userIdB) {
  const a = toIdString(userIdA);
  const b = toIdString(userIdB);
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function buildDirectCompositeKey(userIdA, userIdB, projectId) {
  const pair = directPairKey(userIdA, userIdB);
  if (!projectId) return pair;
  return `${pair}:p:${toIdString(projectId)}`;
}

/** Everyone in the parent workspace (owner + all space members). */
function getSpaceMemberUserIds(project) {
  const ids = new Set();
  const space = project.spaceId;
  if (!space) return ids;
  if (space.owner) {
    const o = space.owner;
    ids.add(o._id ? o._id.toString() : String(o));
  }
  for (const m of space.members || []) {
    if (m.user) {
      const u = m.user;
      ids.add(u._id ? u._id.toString() : String(u));
    }
  }
  return ids;
}

/**
 * Users who may be added to a project-scoped DM or group: project access list ∪ workspace members
 * (so members can reach workspace admins not explicitly on the project roster).
 */
function getEligibleRecipientUserIds(project) {
  const u = new Set(getProjectParticipantUserIds(project).map((x) => x.toString()));
  for (const id of getSpaceMemberUserIds(project)) u.add(id);
  return u;
}

/**
 * All user ids that should appear in the project "General" channel:
 * explicit project members + space owner + space admins (implicit project access).
 */
function getProjectParticipantUserIds(project) {
  const ids = new Set();
  const members = project.members || [];
  for (const m of members) {
    const u = m.user;
    if (u?._id) ids.add(u._id.toString());
    else if (u) ids.add(String(u));
  }
  const space = project.spaceId;
  if (!space) return [...ids].map((id) => new mongoose.Types.ObjectId(id));

  if (space.owner) ids.add(space.owner.toString());
  for (const m of space.members || []) {
    if (m.role === 'admin' && m.user) {
      const uid = m.user._id ? m.user._id.toString() : String(m.user);
      ids.add(uid);
    }
  }
  return [...ids].map((id) => new mongoose.Types.ObjectId(id));
}

async function upsertUserStatesForChat(chatId, userIds) {
  if (!userIds.length) return;
  const ops = userIds.map((uid) => ({
    updateOne: {
      filter: { user: uid, chat: chatId },
      update: { $setOnInsert: { unreadCount: 0, lastReadAt: new Date(0) } },
      upsert: true,
    },
  }));
  await UserChatState.bulkWrite(ops, { ordered: false });
}

async function ensureProjectChannel(projectId) {
  const project = await Project.findById(projectId)
    .populate('spaceId')
    .populate({ path: 'members.user', select: '_id name email avatar' });
  if (!project) return null;

  let chat = await Chat.findOne({ kind: 'project', projectId: project._id });
  const userIds = getProjectParticipantUserIds(project);

  if (!chat) {
    chat = await Chat.create({
      kind: 'project',
      isGroup: true,
      name: `${project.name} · General`,
      projectId: project._id,
      spaceId: project.spaceId?._id || project.spaceId,
      participants: userIds,
      lastMessageAt: new Date(0),
    });
    await upsertUserStatesForChat(chat._id, userIds);
  }

  return chat;
}

async function syncProjectChannelParticipants(projectId) {
  const project = await Project.findById(projectId)
    .populate('spaceId')
    .populate({ path: 'members.user', select: '_id name email avatar' });
  if (!project) return null;

  const chat = await Chat.findOne({ kind: 'project', projectId: project._id });
  if (!chat) return ensureProjectChannel(projectId);

  const userIds = getProjectParticipantUserIds(project);
  chat.participants = userIds;
  await chat.save();
  await upsertUserStatesForChat(chat._id, userIds);
  return chat;
}

/**
 * Delivery/read ticks for the sender's own message (sent → delivered → read).
 * @param {object} msg plain or doc with sender, createdAt, deliveredTo
 * @param {string[]} participantIds chat participant user ids
 * @param {{ user: object, lastReadAt: Date }[]} stateList UserChatState rows for this chat
 */
function computeReceiptStatus(msg, participantIds, stateList) {
  const senderId = msg.sender?._id ? msg.sender._id.toString() : String(msg.sender);
  const parts = (participantIds || []).map((p) => p.toString());
  const others = parts.filter((id) => id !== senderId);
  if (others.length === 0) return 'read';
  const delivered = (msg.deliveredTo || []).map((d) => (d._id ? d._id.toString() : String(d)));
  const allDelivered = others.every((o) => delivered.includes(o));
  if (!allDelivered) return 'sent';
  const stateMap = new Map((stateList || []).map((s) => [s.user.toString(), s.lastReadAt]));
  const allRead = others.every((o) => {
    const lr = stateMap.get(o);
    if (!lr) return false;
    return new Date(lr) >= new Date(msg.createdAt);
  });
  if (allRead) return 'read';
  return 'delivered';
}

async function userCanAccessChat(userId, chat) {
  if (!chat) return false;
  const kind = chat.kind || (chat.isGroup ? 'group' : 'direct');
  if (kind === 'project' && chat.projectId) {
    const { role } = await getProjectRole(chat.projectId, userId);
    return Boolean(role);
  }
  return chat.participants.some((p) => p.toString() === userId.toString());
}

async function assertUserIdsAreProjectScoped(projectId, userIds, requesterId) {
  const project = await Project.findById(projectId)
    .populate({ path: 'members.user', select: '_id name email avatar' })
    .populate({
      path: 'spaceId',
      populate: [
        { path: 'owner', select: '_id name email avatar' },
        { path: 'members.user', select: '_id name email avatar' },
      ],
    });
  if (!project) {
    const err = new Error('Project not found');
    err.status = 404;
    throw err;
  }
  const allowed = getEligibleRecipientUserIds(project);
  allowed.add(requesterId.toString());
  for (const uid of userIds) {
    if (!allowed.has(uid.toString())) {
      const err = new Error('Participants must be on this project or in the parent workspace');
      err.status = 400;
      throw err;
    }
  }
}

module.exports = {
  directPairKey,
  buildDirectCompositeKey,
  getProjectParticipantUserIds,
  getEligibleRecipientUserIds,
  computeReceiptStatus,
  upsertUserStatesForChat,
  ensureProjectChannel,
  syncProjectChannelParticipants,
  userCanAccessChat,
  assertUserIdsAreProjectScoped,
};
