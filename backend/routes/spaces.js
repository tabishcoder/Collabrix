const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getAllSpaces,
  getSpaceById,
  createSpace,
  updateSpace,
  deleteSpace,
  addSpaceMember,
  removeSpaceMember
} = require('../controller/spaces');

// @desc Get all spaces for authenticated user
// @route GET /api/spaces
// @access Private
router.get('/', auth, getAllSpaces);

// @desc Get a specific space by ID
// @route GET /api/spaces/:id
// @access Private
router.get('/:id', auth, getSpaceById);

// @desc Create a new space
// @route POST /api/spaces
// @access Private
router.post('/', auth, createSpace);

// @desc Update space details (Owner only)
// @route PUT /api/spaces/:id
// @access Private
router.put('/:id', auth, updateSpace);

// @desc Delete a space (Owner only)
// @route DELETE /api/spaces/:id
// @access Private
router.delete('/:id', auth, deleteSpace);

// @desc Add member to space (Owner only)
// @route POST /api/spaces/:id/members
// @access Private
router.post('/:id/members', auth, addSpaceMember);

// @desc Remove member from space (Owner only)
// @route DELETE /api/spaces/:id/members/:userId
// @access Private
router.delete('/:id/members/:userId', auth, removeSpaceMember);

module.exports = router;
