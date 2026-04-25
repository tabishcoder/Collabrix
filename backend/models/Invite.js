const mongoose = require('mongoose');

/**
 * Workspace-level invite.
 * A unique pending invite per (workspaceId + email) is enforced in the controller
 * (resend deletes the old one and creates fresh).
 */
const InviteSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'Space',
    required: true
  },
  email: {
    type:      String,
    required:  true,
    lowercase: true,
    trim:      true
  },
  role: {
    type:    String,
    enum:    ['admin', 'member'],
    default: 'member'
  },
  tokenHash: {
    type:     String,
    required: true
  },
  status: {
    type:    String,
    enum:    ['pending', 'accepted', 'revoked'],
    default: 'pending'
  },
  invitedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  expiresAt: {
    type:    Date,
    default: () => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
  }
}, { timestamps: true });

// TTL – MongoDB auto-deletes expired invites
InviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Fast lookup by token hash
InviteSchema.index({ tokenHash: 1 });
// Quickly find all pending invites for a workspace
InviteSchema.index({ workspaceId: 1, status: 1 });

module.exports = mongoose.model('Invite', InviteSchema);
