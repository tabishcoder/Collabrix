const express = require('express');
const router  = express.Router();
const { auth } = require('../middleware/auth');
const { requireSpaceRole } = require('../middleware/authorize');
const {
  getAllSpaces,
  getSpaceById,
  getSpaceMembers,
  createSpace,
  updateSpace,
  deleteSpace,
  addSpaceMember,
  updateSpaceMemberRole,
  removeSpaceMember,
  leaveSpace
} = require('../controller/spaces.controller');

const ADMIN = ['owner', 'admin'];
const OWNER = ['owner'];

router.get('/',    auth, getAllSpaces);
router.get('/:id', auth, getSpaceById);
router.post('/',   auth, createSpace);

router.put('/:id',    auth, requireSpaceRole(ADMIN), updateSpace);
router.delete('/:id', auth, requireSpaceRole(OWNER), deleteSpace);

// Members
router.get('/:id/members',                   auth, requireSpaceRole([...ADMIN, 'member']), getSpaceMembers);
router.post('/:id/members',                  auth, requireSpaceRole(ADMIN), addSpaceMember);
router.put('/:id/members/:userId/role',      auth, requireSpaceRole(ADMIN), updateSpaceMemberRole);
router.delete('/:id/members/me',             auth, requireSpaceRole([...ADMIN, 'member']), leaveSpace);
router.delete('/:id/members/:userId',        auth, requireSpaceRole(ADMIN), removeSpaceMember);

module.exports = router;
