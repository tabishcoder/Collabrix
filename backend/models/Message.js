const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
    /** Recipients (excluding sender) who have acked delivery via socket */
    deliveredTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    clientMessageId: { type: String, default: null, sparse: true },
    editedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

MessageSchema.index({ chat: 1, createdAt: -1 });
MessageSchema.index(
  { chat: 1, clientMessageId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      clientMessageId: { $exists: true, $type: 'string', $gt: '' },
    },
  },
);

module.exports = mongoose.model('Message', MessageSchema);
