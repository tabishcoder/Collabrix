const mongoose = require('mongoose');

const InvitationSchema = new mongoose.Schema({
  invitedEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  inviterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  role: {
    type: String,
    default: 'member'
  },
  hashedToken: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['invited', 'accepted'],
    default: 'invited'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '3d' // TTL index to automatically delete 3 days after creation
  }
});

// Compound index to quickly find an invitation for a specific user to a project
InvitationSchema.index({ invitedEmail: 1, projectId: 1 });

module.exports = mongoose.model('Invitation', InvitationSchema);
