const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  listNotifications,
  markNotificationRead,
  markAllRead,
} = require('../controller/notifications.controller');

router.get('/', auth, listNotifications);
router.patch('/:id/read', auth, markNotificationRead);
router.post('/read-all', auth, markAllRead);

module.exports = router;
