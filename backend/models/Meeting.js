const mongoose = require('mongoose');

const MeetingParticipantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['host', 'participant'], required: true },
    joinedAt: { type: Date, default: Date.now },
    leftAt: { type: Date, default: null },
  },
  { _id: true }
);

const MeetingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null, index: true },
    /** When set, this ACS group call is scoped to a chat (voice-only UI in app). */
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', default: null, index: true },
    callKind: {
      type: String,
      enum: ['meeting', 'chat_voice'],
      default: 'meeting',
      index: true,
    },
    groupId: { type: String, required: true },
    participants: [MeetingParticipantSchema],
    status: { type: String, enum: ['active', 'ended'], default: 'active', index: true },
    endedAt: { type: Date, default: null },
    /** AI / knowledge — not used for chat_voice (private) meetings */
    transcript: { type: String, default: '' },
    transcriptLanguage: {
      type: String,
      enum: ['en', 'ur', 'mixed'],
      default: 'en',
    },
    aiSummary: { type: String, default: '' },
    aiActionItems: { type: String, default: '' },
    transcriptSubmittedAt: { type: Date, default: null },
    transcriptSubmittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    transcriptSource: {
      type: String,
      enum: ['manual', 'whisper_local'],
      default: 'manual',
    },
  },
  { timestamps: true }
);

MeetingSchema.index({ status: 1, createdAt: -1 });
MeetingSchema.index({ chatId: 1, callKind: 1, status: 1 });

module.exports = mongoose.model('Meeting', MeetingSchema);
