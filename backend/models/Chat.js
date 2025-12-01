const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  isGroup: { type: Boolean, default: false },
  name: { type: String, default: null }, // group name
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastMessage: { type: String, default: '' },
  unread: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Chat', ChatSchema);
