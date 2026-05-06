const mongoose = require('mongoose');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const UserChatState = require('../models/UserChatState');
const { getProjectRole, PROJECT_MANAGE_ROLES } = require('../utils/rbac');
const User = require('../models/User');
const { createNotification } = require('../utils/pushNotification');
const Project = require('../models/Project');
const {
  buildDirectCompositeKey,
  directPairKey,
  ensureProjectChannel,
  upsertUserStatesForChat,
  userCanAccessChat,
  assertUserIdsAreProjectScoped,
  computeReceiptStatus,
} = require('../services/chatService');

const DEFAULT_PAGE = 40;

function getIO(req) {
  return req.app.get('io');
}

function timeAgo(timestamp) {
  if (!timestamp) return '';
  const now = new Date();
  const past = new Date(timestamp);
  const diff = (now - past) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) {
    const mins = Math.floor(diff / 60);
    return `${mins} min${mins > 1 ? 's' : ''} ago`;
  }
  if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  if (diff < 604800) {
    const days = Math.floor(diff / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function normalizeKind(doc) {
  if (doc.kind) return doc.kind;
  if (doc.isGroup) return 'group';
  return 'direct';
}

function enrichMessage(msgDoc, chat, stateList, viewerId) {
  const o = msgDoc.toObject ? msgDoc.toObject() : { ...msgDoc };
  const sid = o.sender?._id ? o.sender._id.toString() : String(o.sender);
  const participantIds = (chat.participants || []).map((p) => p.toString());
  if (sid === viewerId.toString()) {
    o.receiptStatus = computeReceiptStatus(o, participantIds, stateList);
  }
  if (o.deletedAt) {
    o.content = '';
    o.isDeleted = true;
  }
  return o;
}

async function attachUnreadForUser(userId, chatDocs) {
  const ids = chatDocs.map((c) => c._id);
  const states = await UserChatState.find({ user: userId, chat: { $in: ids } }).lean();
  const map = new Map(states.map((s) => [s.chat.toString(), s]));
  return chatDocs.map((c) => {
    const o = c.toObject ? c.toObject() : { ...c };
    o.kind = normalizeKind(o);
    if (o.kind === 'project' && !o.name) o.name = 'General';
    const st = map.get(o._id.toString());
    o.unreadCount = st?.unreadCount ?? 0;
    o.lastActivityLabel = timeAgo(o.lastMessageAt || o.updatedAt);
    return o;
  });
}

async function findLegacyDirectChat(userA, userB, projectId) {
  const pid = projectId ? new mongoose.Types.ObjectId(projectId) : null;
  const base = {
    isGroup: false,
    $or: [{ kind: 'direct' }, { kind: { $exists: false } }],
    participants: { $all: [userA, userB], $size: 2 },
  };
  if (pid) {
    return Chat.findOne({ ...base, projectId: pid });
  }
  return Chat.findOne({
    ...base,
    $or: [{ projectId: null }, { projectId: { $exists: false } }],
  });
}

module.exports.findOrCreatePrivateChat = async (req, res) => {
  const userA = req.user._id;
  const { userId: userB, projectId } = req.body;
  try {
    if (!userB) return res.status(400).json({ error: 'userId is required' });
    if (userB === userA.toString()) return res.status(400).json({ error: 'Cannot chat with yourself' });

    if (projectId) {
      await assertUserIdsAreProjectScoped(projectId, [userA, userB], userA);
    }

    const composite = buildDirectCompositeKey(userA, userB, projectId);
    let chat = await Chat.findOne({ directCompositeKey: composite });
    if (!chat) chat = await findLegacyDirectChat(userA, userB, projectId);

    if (!chat) {
      const pid = projectId ? new mongoose.Types.ObjectId(projectId) : null;
      const pairKey = directPairKey(userA, userB);
      chat = await Chat.create({
        kind: 'direct',
        isGroup: false,
        participants: [userA, new mongoose.Types.ObjectId(userB)],
        projectId: pid,
        directKey: pairKey,
        directCompositeKey: composite,
        lastMessageAt: new Date(0),
      });
      await upsertUserStatesForChat(chat._id, [userA, new mongoose.Types.ObjectId(userB)]);
    } else if (!chat.directCompositeKey) {
      chat.directCompositeKey = composite;
      chat.directKey = directPairKey(userA, userB);
      if (projectId && !chat.projectId) chat.projectId = new mongoose.Types.ObjectId(projectId);
      if (!chat.kind) chat.kind = 'direct';
      await chat.save();
    }

    const populated = await Chat.findById(chat._id).populate('participants', '_id name email avatar');
    const [withUnread] = await attachUnreadForUser(req.user._id, [populated]);
    res.json(withUnread);
  } catch (err) {
    const code = err.status || 500;
    res.status(code).json({ error: err.message });
  }
};

module.exports.getChatsForProject = async (req, res) => {
  try {
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ error: 'projectId query is required' });

    const { role } = await getProjectRole(projectId, req.user._id);
    if (!role) return res.status(403).json({ error: 'Access denied' });

    await ensureProjectChannel(projectId);

    const pid = new mongoose.Types.ObjectId(projectId);
    const chats = await Chat.find({
      projectId: pid,
      $or: [{ participants: req.user._id }, { kind: 'project' }],
    })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .populate('participants', '_id name email avatar');

    const formatted = await attachUnreadForUser(req.user._id, chats);
    formatted.sort((a, b) => {
      if (a.kind === 'project') return -1;
      if (b.kind === 'project') return 1;
      const ta = new Date(a.lastMessageAt || a.updatedAt).getTime();
      const tb = new Date(b.lastMessageAt || b.updatedAt).getTime();
      return tb - ta;
    });
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/** @deprecated prefer GET /?projectId= */
module.exports.getAllChats = async (req, res) => {
  if (req.query.projectId) {
    return module.exports.getChatsForProject(req, res);
  }
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .populate('participants', '_id name email avatar');
    const formatted = await attachUnreadForUser(req.user._id, chats);
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports.getChatMessages = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    const allowed = await userCanAccessChat(req.user._id, chat);
    if (!allowed) return res.status(403).json({ error: 'Forbidden' });

    const limit = Math.min(parseInt(req.query.limit, 10) || DEFAULT_PAGE, 100);
    const beforeId = req.query.before;
    const query = { chat: req.params.chatId };
    if (beforeId && mongoose.Types.ObjectId.isValid(beforeId)) {
      const cursor = await Message.findById(beforeId).select('createdAt');
      if (cursor) query.createdAt = { $lt: cursor.createdAt };
    }

    const states = await UserChatState.find({ chat: chat._id }).lean();
    const readReceipts = {};
    for (const s of states) {
      readReceipts[s.user.toString()] = s.lastReadAt;
    }

    const msgs = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('sender', '_id name email avatar');

    const viewerId = req.user._id;
    const enriched = msgs.map((m) => enrichMessage(m, chat, states, viewerId)).reverse();
    res.json({ messages: enriched, hasMore: msgs.length === limit, readReceipts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

function emitToChat(io, chatId, event, payload) {
  if (!io) return;
  io.to(`chat-${chatId}`).emit(event, payload);
}

function emitInbox(io, userIds, payload) {
  if (!io) return;
  for (const uid of userIds) {
    io.to(`user-${uid}`).emit('chat:inbox', payload);
  }
}

module.exports.sendChatMessage = async (req, res) => {
  try {
    const { content, clientMessageId } = req.body;
    const trimmed = (content || '').trim();
    if (!trimmed) return res.status(400).json({ error: 'Message content is required' });
    if (trimmed.length > 8000) return res.status(400).json({ error: 'Message too long' });

    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    const allowed = await userCanAccessChat(req.user._id, chat);
    if (!allowed) return res.status(403).json({ error: 'Forbidden' });

    if (clientMessageId) {
      const existing = await Message.findOne({ chat: chat._id, clientMessageId });
      if (existing) {
        const populated = await Message.findById(existing._id).populate('sender', '_id name email avatar');
        return res.status(200).json(populated);
      }
    }

    const msg = await Message.create({
      chat: chat._id,
      sender: req.user._id,
      content: trimmed,
      clientMessageId: clientMessageId || null,
    });

    const now = new Date();
    chat.lastMessageText = trimmed.slice(0, 280);
    chat.lastMessageAt = now;
    await chat.save();

    const recipientIds = chat.participants.map((p) => p.toString());
    await UserChatState.updateMany(
      { chat: chat._id, user: { $ne: req.user._id } },
      { $inc: { unreadCount: 1 } },
    );

    const populated = await Message.findById(msg._id).populate('sender', '_id name email avatar');
    const io = getIO(req);

    emitToChat(io, chat._id, 'chat:message', { message: populated.toObject(), chatId: chat._id.toString() });

    const inboxPayload = {
      chatId: chat._id.toString(),
      projectId: chat.projectId ? chat.projectId.toString() : null,
      lastMessageText: chat.lastMessageText,
      lastMessageAt: chat.lastMessageAt,
      kind: normalizeKind(chat),
      name: chat.name,
      senderId: req.user._id.toString(),
      senderPreview: populated.sender?.name || 'Someone',
    };
    emitInbox(io, recipientIds, inboxPayload);

    const senderDoc = await User.findById(req.user._id).select('name');
    const senderName = senderDoc?.name || 'Someone';
    const title = chat.name ? `${senderName} in ${chat.name}` : `${senderName} sent a message`;
    for (const rid of recipientIds) {
      if (rid === req.user._id.toString()) continue;
      try {
        await createNotification(req, {
          userId: rid,
          type: 'chat_message',
          title,
          body: trimmed.slice(0, 160),
          link: '/chats',
          meta: { chatId: chat._id.toString(), projectId: chat.projectId ? chat.projectId.toString() : '' },
        });
      } catch (e) {
        console.error('chat notification', e?.message);
      }
    }

    res.status(201).json(populated);
  } catch (err) {
    if (err.code === 11000) {
      const dup = await Message.findOne({ chat: req.params.chatId, clientMessageId: req.body.clientMessageId });
      if (dup) {
        const populated = await Message.findById(dup._id).populate('sender', '_id name email avatar');
        return res.status(200).json(populated);
      }
    }
    res.status(500).json({ error: err.message });
  }
};

module.exports.markChatRead = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    const allowed = await userCanAccessChat(req.user._id, chat);
    if (!allowed) return res.status(403).json({ error: 'Forbidden' });

    await UserChatState.findOneAndUpdate(
      { user: req.user._id, chat: chat._id },
      { $set: { unreadCount: 0, lastReadAt: new Date() } },
      { upsert: true },
    );

    const io = getIO(req);
    const readAt = new Date().toISOString();
    emitToChat(io, chat._id, 'chat:read', { chatId: chat._id.toString(), userId: req.user._id.toString() });
    emitToChat(io, chat._id, 'chat:read-updated', {
      chatId: chat._id.toString(),
      readerId: req.user._id.toString(),
      readAt,
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports.deleteMessage = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    const allowed = await userCanAccessChat(req.user._id, chat);
    if (!allowed) return res.status(403).json({ error: 'Forbidden' });

    const msg = await Message.findOne({ _id: req.params.messageId, chat: chat._id });
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    if (msg.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }
    if (msg.deletedAt) {
      const again = await Message.findById(msg._id).populate('sender', '_id name email avatar');
      return res.json(again);
    }

    msg.deletedAt = new Date();
    // msg.content = '';
    await msg.save();
    const populated = await Message.findById(msg._id).populate('sender', '_id name email avatar');
    const io = getIO(req);
    emitToChat(io, chat._id, 'chat:message-deleted', {
      chatId: chat._id.toString(),
      message: populated.toObject(),
    });
    res.json(populated);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports.deleteChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    const allowed = await userCanAccessChat(req.user._id, chat);
    if (!allowed) return res.status(403).json({ error: 'Forbidden' });

    const kind = normalizeKind(chat);
    if (kind === 'project') {
      return res.status(403).json({ error: 'The project channel cannot be deleted' });
    }

    const { role } = chat.projectId ? await getProjectRole(chat.projectId, req.user._id) : { role: null };
    if (kind === 'direct') {
      const isPart = chat.participants.some((p) => p.toString() === req.user._id.toString());
      if (!isPart) return res.status(403).json({ error: 'Forbidden' });
    } else if (kind === 'group') {
      const isCreator = chat.createdBy && chat.createdBy.toString() === req.user._id.toString();
      const isManager = PROJECT_MANAGE_ROLES.includes(role);
      if (!isCreator && !isManager) {
        return res.status(403).json({ error: 'Only the group creator or a project manager can delete this group' });
      }
    }

    const participantIds = chat.participants.map((p) => p.toString());
    await Message.deleteMany({ chat: chat._id });
    await UserChatState.deleteMany({ chat: chat._id });
    await chat.deleteOne();

    const io = getIO(req);
    for (const uid of participantIds) {
      io.to(`user-${uid}`).emit('chat:removed', { chatId: req.params.chatId });
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports.createGroupChat = async (req, res) => {
  try {
    const { name, participantIds, projectId } = req.body;
    const trimmed = (name || '').trim();
    if (!trimmed) return res.status(400).json({ error: 'Group name is required' });
    if (!Array.isArray(participantIds)) return res.status(400).json({ error: 'participantIds must be an array' });
    if (!projectId) return res.status(400).json({ error: 'projectId is required for workspace groups' });

    const uniqueIds = Array.from(new Set(participantIds.filter(Boolean)));
    if (uniqueIds.length < 1) return res.status(400).json({ error: 'Add at least one other member' });

    await assertUserIdsAreProjectScoped(projectId, [...uniqueIds, req.user._id], req.user._id);

    const participants = Array.from(
      new Set([...uniqueIds.map((id) => id.toString()), req.user._id.toString()]),
    ).map((id) => new mongoose.Types.ObjectId(id));

    const pid = new mongoose.Types.ObjectId(projectId);
    const project = await Project.findById(pid).select('spaceId');
    const chat = await Chat.create({
      kind: 'group',
      isGroup: true,
      name: trimmed,
      participants,
      projectId: pid,
      spaceId: project?.spaceId || null,
      createdBy: req.user._id,
      lastMessageAt: new Date(0),
    });

    await upsertUserStatesForChat(chat._id, participants);

    const populated = await Chat.findById(chat._id).populate('participants', '_id name email avatar');
    const [withUnread] = await attachUnreadForUser(req.user._id, [populated]);
    res.status(201).json(withUnread);
  } catch (err) {
    const code = err.status || 500;
    res.status(code).json({ error: err.message });
  }
};
