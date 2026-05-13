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
    /** No default — storing null breaks the unique index (many group/project chats would share null). */
    directKey: { type: String },
    /** Unique lookup for direct DMs including optional project scope (omit on group/project chats). */
    directCompositeKey: { type: String },
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
// Only index real DM keys so group/project chats (no field) do not collide on null.
ChatSchema.index(
  { directCompositeKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      directCompositeKey: { $type: 'string', $gt: '' },
    },
  },
);
ChatSchema.index({ kind: 1, projectId: 1 });

module.exports = mongoose.model('Chat', ChatSchema);
