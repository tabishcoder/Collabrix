const mongoose = require('mongoose');

/** Per-user read cursor and unread count for a conversation. */
const UserChatStateSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
    unreadCount: { type: Number, default: 0 },
    lastReadAt: { type: Date, default: () => new Date(0) },
  },
  { timestamps: true },
);

UserChatStateSchema.index({ user: 1, chat: 1 }, { unique: true });
UserChatStateSchema.index({ chat: 1 });

module.exports = mongoose.model('UserChatState', UserChatStateSchema);
