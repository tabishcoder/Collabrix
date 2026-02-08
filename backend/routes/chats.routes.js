const express = require('express');
const auth = require('../middleware/auth');
const {
  findOrCreatePrivateChat,
  getAllChats,
  getChatMessages,
  createGroupChat
} = require('../controller/chats.controller');

const router = express.Router();

// @desc Find or create 1-1 private chat between two users
// @route POST /api/chats/private
// @access Private
router.post('/private', auth, findOrCreatePrivateChat);

// @desc Get all chats for authenticated user
// @route GET /api/chats
// @access Private
router.get('/', auth, getAllChats);

// @desc Get messages for a chat
// @route GET /api/chats/:chatId/messages
// @access Private
router.get('/:chatId/messages', auth, getChatMessages);

// @desc Create a group chat
// @route POST /api/chats/group
// @access Private
router.post('/group', auth, createGroupChat);

module.exports = router;
