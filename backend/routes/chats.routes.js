const express = require('express');
const { auth } = require('../middleware/auth');
const {
  findOrCreatePrivateChat,
  getAllChats,
  getChatMessages,
  createGroupChat,
  sendChatMessage,
  markChatRead,
  deleteMessage,
  deleteChat,
  startChatVoiceCall,
} = require('../controller/chats.controller');

const router = express.Router();

router.get('/', auth, getAllChats);

router.post('/private', auth, findOrCreatePrivateChat);

router.post('/group', auth, createGroupChat);

router.post('/:chatId/voice-call/start', auth, startChatVoiceCall);

router.delete('/:chatId/messages/:messageId', auth, deleteMessage);

router.delete('/:chatId', auth, deleteChat);

router.post('/:chatId/read', auth, markChatRead);

router.post('/:chatId/messages', auth, sendChatMessage);

router.get('/:chatId/messages', auth, getChatMessages);

module.exports = router;
