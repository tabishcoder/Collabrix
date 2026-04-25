const crypto  = require('crypto');
const Space    = require('../models/Space');
const User     = require('../models/User');
const Invite   = require('../models/Invite');
const History  = require('../models/History');
const { getSpaceRole, SPACE_ADMIN_ROLES } = require('../utils/rbac');
const { sendWorkspaceInvitationEmail }    = require('../utils/email');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const logHistory = async (entityType, entityId, action, performedBy, details = {}) => {
  await History.create({ entityType, entityId, action, performedBy, details });
};

// ─── Create / resend invite ────────────────────────────────────────────────────

module.exports.sendInvite = async (req, res) => {
  try {
    const { workspaceId, email, role = 'member' } = req.body;

    if (!workspaceId || !email) {
      return res.status(400).json({ message: 'workspaceId and email are required' });
    }
    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ message: 'role must be admin or member' });
    }

    const { role: callerRole, space } = await getSpaceRole(workspaceId, req.user._id);
    if (!SPACE_ADMIN_ROLES.includes(callerRole)) {
      return res.status(403).json({ message: 'Only workspace owner or admin can invite members.' });
    }

    const normalEmail = email.toLowerCase().trim();

    // Cannot invite yourself
    if (normalEmail === req.user.email.toLowerCase()) {
      return res.status(400).json({ message: 'You cannot invite yourself.' });
    }

    // Cannot invite existing members
    const isOwner  = space.owner.toString() === req.user._id.toString();
    const isMember = space.members.some((m) => {
      const user = m.user;
      // compare against email if populated, or just the ObjectId
      return user?.email?.toLowerCase() === normalEmail;
    });

    // Simpler check: look up the user by email and see if they're already a member
    const existingUser = await User.findOne({ email: normalEmail }).select('_id');
    if (existingUser) {
      const alreadyIn =
        space.owner.toString() === existingUser._id.toString() ||
        space.members.some((m) => m.user.toString() === existingUser._id.toString());
      if (alreadyIn) {
        return res.status(400).json({ message: 'User is already a workspace member.' });
      }
    }

    // Delete any existing pending invite for this email+workspace (resend)
    await Invite.deleteMany({ workspaceId, email: normalEmail, status: 'pending' });

    // Generate secure token
    const rawToken   = crypto.randomBytes(32).toString('hex');
    const tokenHash  = crypto.createHash('sha256').update(rawToken).digest('hex');

    await Invite.create({
      workspaceId,
      email:     normalEmail,
      role,
      tokenHash,
      invitedBy: req.user._id
    });

    const inviteLink = `${CLIENT_URL}/join-workspace?token=${rawToken}`;

    // Fire email – if SMTP is not configured, log and continue
    try {
      await sendWorkspaceInvitationEmail(normalEmail, req.user.name, space.name, role, inviteLink);
    } catch (mailErr) {
      console.error('Failed to send invite email:', mailErr.message);
    }

    await logHistory('space', workspaceId, 'invite_sent', req.user._id, {
      invitedEmail: normalEmail, role
    });

    res.status(200).json({ message: 'Invitation sent successfully', inviteLink });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Get invite info (public) ──────────────────────────────────────────────────

module.exports.getInviteInfo = async (req, res) => {
  try {
    const { token } = req.params;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const invite = await Invite.findOne({ tokenHash, status: 'pending' })
      .populate('workspaceId', 'name')
      .populate('invitedBy',   'name');

    if (!invite) {
      return res.status(404).json({ message: 'Invitation not found or already used.' });
    }
    if (new Date() > invite.expiresAt) {
      return res.status(410).json({ message: 'Invitation has expired.' });
    }

    res.json({
      workspace: { _id: invite.workspaceId._id, name: invite.workspaceId.name },
      invitedBy: invite.invitedBy?.name ?? 'A team member',
      role:      invite.role,
      email:     invite.email
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Accept invite (auth required) ────────────────────────────────────────────

module.exports.acceptInvite = async (req, res) => {
  try {
    const { token } = req.params;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const invite = await Invite.findOne({ tokenHash, status: 'pending' });
    if (!invite) {
      return res.status(404).json({ message: 'Invitation not found or already used.' });
    }
    if (new Date() > invite.expiresAt) {
      return res.status(410).json({ message: 'Invitation has expired.' });
    }

    // Verify email matches
    if (req.user.email.toLowerCase() !== invite.email.toLowerCase()) {
      return res.status(403).json({
        message: 'This invitation was sent to a different email address.'
      });
    }

    const space = await Space.findById(invite.workspaceId);
    if (!space) return res.status(404).json({ message: 'Workspace not found.' });

    // Idempotent: user might already be a member
    const alreadyMember =
      space.owner.toString() === req.user._id.toString() ||
      space.members.some((m) => m.user.toString() === req.user._id.toString());

    if (!alreadyMember) {
      space.members.push({ user: req.user._id, role: invite.role });
      await space.save();
    }

    invite.status     = 'accepted';
    invite.acceptedBy = req.user._id;
    await invite.save();

    await logHistory('space', space._id, 'invite_accepted', req.user._id, {
      role: invite.role
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`space-${space._id}`).emit('member-added', {
        userId: req.user._id,
        role:   invite.role
      });
    }

    res.json({
      message:   'Successfully joined the workspace.',
      workspace: { _id: space._id, name: space.name },
      role:      invite.role
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── List pending invites for a workspace (admin only) ────────────────────────

module.exports.getWorkspaceInvites = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { role } = await getSpaceRole(workspaceId, req.user._id);
    if (!SPACE_ADMIN_ROLES.includes(role)) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const invites = await Invite.find({ workspaceId, status: 'pending' })
      .populate('invitedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(invites);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Revoke invite (admin only) ───────────────────────────────────────────────

module.exports.revokeInvite = async (req, res) => {
  try {
    const invite = await Invite.findById(req.params.inviteId);
    if (!invite) return res.status(404).json({ message: 'Invite not found.' });

    const { role } = await getSpaceRole(invite.workspaceId, req.user._id);
    if (!SPACE_ADMIN_ROLES.includes(role)) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    invite.status = 'revoked';
    await invite.save();
    res.json({ message: 'Invite revoked.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
