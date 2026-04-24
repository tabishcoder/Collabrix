const express = require('express');
const router  = express.Router();
const { auth } = require('../middleware/auth');
const {
  sendInvite,
  getInviteInfo,
  acceptInvite,
  getWorkspaceInvites,
  revokeInvite
} = require('../controller/invites.controller');

// Public – anyone with the token can preview the invite
router.get('/token/:token', getInviteInfo);

// Auth required
router.post('/workspace',                         auth, sendInvite);
router.post('/token/:token/accept',               auth, acceptInvite);
router.get('/workspace/:workspaceId/pending',     auth, getWorkspaceInvites);
router.delete('/:inviteId',                       auth, revokeInvite);

module.exports = router;
