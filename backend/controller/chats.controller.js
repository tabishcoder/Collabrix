const Chat = require('../models/Chat');
const Message = require('../models/Message');

// Helper to format timestamp to human-readable
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

  return past.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

module.exports.findOrCreatePrivateChat = async (req, res) => {
  const userA = req.user._id;
  const userB = req.body.userId;
  try {
    let chat = await Chat.findOne({ isGroup: false, participants: { $all: [userA, userB], $size: 2 } });
    if (!chat) chat = await Chat.create({ participants: [userA, userB] });
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports.getAllChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: { $in: [req.user._id] }
    }).populate('participants', '_id name email');

    const formattedChats = chats.map(chat => {
      const obj = chat.toObject();
      obj.updatedAt = timeAgo(chat.updatedAt);
      return obj;
    });

    res.json(formattedChats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports.getChatMessages = async (req, res) => {
  try {
    const msgs = await Message.find({ chat: req.params.chatId })
      .sort({ createdAt: 1 })
      .populate('sender', 'name');
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports.createGroupChat = async (req, res) => {
  try {
    const { name, participantIds } = req.body;
    const trimmed = (name || '').trim();
    if (!trimmed) return res.status(400).json({ error: 'Group name is required' });
    if (!Array.isArray(participantIds)) return res.status(400).json({ error: 'participantIds must be an array' });
    const uniqueIds = Array.from(new Set(participantIds.filter(Boolean)));
    if (uniqueIds.length < 2) return res.status(400).json({ error: 'Add at least two members' });

    const participants = Array.from(new Set([...uniqueIds, req.user._id]));
    const chat = await Chat.create({ isGroup: true, name: trimmed, participants });
    const populated = await Chat.findById(chat._id).populate('participants', '_id name email');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
