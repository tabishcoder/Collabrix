const express = require('express');
const auth = require('../middleware/auth');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

const router = express.Router();

// Create or get 1-1 chat between two users
// POST /api/chats/private  { userId }
function timeAgo(timestamp) {
  const now = new Date();
  const past = new Date(timestamp);
  const diff = (now - past) / 1000; // difference in seconds

  if (diff < 60) return "Just now";
  if (diff < 3600) {
    const mins = Math.floor(diff / 60);
    return `${mins} min${mins > 1 ? "s" : ""} ago`;
  }
  if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }
  if (diff < 604800) {
    const days = Math.floor(diff / 86400);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  // fallback for older messages
  return past.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
// find the private chat between user and particular receiver
router.post('/private', auth, async (req, res) => {
  const userA = req.user._id, userB = req.body.userId;
  try {
    let chat = await Chat.findOne({ isGroup: false, participants: { $all: [userA, userB], $size: 2 } });
    // if not found, create a new chat else return the existing chat
    if (!chat) chat = await Chat.create({ participants: [userA, userB] });
    res.json(chat);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/', auth, async (req, res) => {
  // return all chats of the requesting user
  const chats = await Chat.find({
    participants: { $in: [req.user._id] }
  }).populate('participants', '_id name email');

  const formattedChats = chats.map(chat => {
    const obj = chat.toObject(); // convert to plain object
    obj.updatedAt = timeAgo(chat.updatedAt); // convert timestamp to human-readable
    return obj;
  });

  res.json(formattedChats);
});

// Get messages for a chat
// GET /api/chats/:chatId/messages
router.get('/:chatId/messages', auth, async (req, res) => {
  // return all messages of the chat
  const msgs = await Message.find({ chat: req.params.chatId }).sort({ createdAt: 1 }).populate('sender', 'name');
  res.json(msgs);
});

// create group
// POST /api/chats/group { name, participantIds: [] }
router.post('/group', auth, async (req, res) => {
  try {
    const { name, participantIds } = req.body;
    const trimmed = (name || '').trim();
    if (!trimmed) return res.status(400).json({ error: 'Group name is required' });
    if (!Array.isArray(participantIds)) return res.status(400).json({ error: 'participantIds must be an array' });
    // Require at least two other members besides the creator
    const uniqueIds = Array.from(new Set(participantIds.filter(Boolean)));
    if (uniqueIds.length < 2) return res.status(400).json({ error: 'Add at least two members' });

    const participants = Array.from(new Set([...uniqueIds, req.user._id]));
    const chat = await Chat.create({ isGroup: true, name: trimmed, participants });
    const populated = await Chat.findById(chat._id).populate('participants', '_id name email');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
