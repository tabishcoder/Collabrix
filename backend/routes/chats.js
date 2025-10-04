const express = require('express');
const auth = require('../middleware/auth');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

const router = express.Router();

// Create or get 1-1 chat between two users
// POST /api/chats/private  { userId }
router.post('/private', auth, async (req, res) => {
  const userA = req.user._id, userB = req.body.userId;
  try {
    let chat = await Chat.findOne({ isGroup: false, participants: { $all: [userA, userB], $size: 2 } });
    if (!chat) chat = await Chat.create({ participants: [userA, userB] });
    res.json(chat);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/', auth, async (req, res) => { 
  const chats = await Chat.find({ participants: { $in: [req.user._id] } }).populate('participants', '_id name email');
  res.json(chats);
});

// Get messages for a chat
// GET /api/chats/:chatId/messages
router.get('/:chatId/messages', auth, async (req, res) => {
  const msgs = await Message.find({ chat: req.params.chatId }).sort({ createdAt: 1 }).populate('sender', 'name');
  res.json(msgs);
});

// create group
// POST /api/chats/group { name, participantIds: [] }
router.post('/group', auth, async (req, res) => {
  const { name, participantIds } = req.body;
  const participants = Array.from(new Set([...participantIds, req.user.id]));
  const chat = await Chat.create({ isGroup: true, name, participants });
  res.json(chat);
});

module.exports = router;
