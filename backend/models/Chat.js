const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema(
  {
    /** direct | group | project — project = auto channel for a board */
    kind: {
      type: String,
      enum: ['direct', 'group', 'project'],
      default: 'direct',
    },
    isGroup: { type: Boolean, default: false },
    name: { type: String, default: null },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    /** Stable key for direct chats: `${minId}:${maxId}` optionally scoped in directCompositeKey */
    directKey: { type: String, default: null },
    /** Unique lookup for direct DMs including optional project scope */
    directCompositeKey: { type: String, default: null },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null, sparse: true },
    spaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Space', default: null, sparse: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    archivedAt: { type: Date, default: null },
    lastMessageText: { type: String, default: '' },
    lastMessageAt: { type: Date, default: null },
    /** @deprecated use UserChatState — kept for legacy documents */
    unread: { type: Number, default: 0 },
  },
  { timestamps: true },
);

ChatSchema.index({ projectId: 1, updatedAt: -1 });
ChatSchema.index({ participants: 1, updatedAt: -1 });
ChatSchema.index({ directCompositeKey: 1 }, { unique: true, sparse: true });
ChatSchema.index({ kind: 1, projectId: 1 });

module.exports = mongoose.model('Chat', ChatSchema);
