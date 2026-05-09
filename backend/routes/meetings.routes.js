const express = require('express');
const { auth } = require('../middleware/auth');
const {
  createMeeting,
  joinMeeting,
  leaveMeeting,
  endMeeting,
  getMeetingById,
  listMeetingsForProject,
} = require('../controller/meetings.controller');

const router = express.Router();

router.get('/', auth, listMeetingsForProject);
router.post('/create', auth, createMeeting);
router.post('/:id/join', auth, joinMeeting);
router.post('/:id/leave', auth, leaveMeeting);
router.post('/:id/end', auth, endMeeting);
router.get('/:id', auth, getMeetingById);

module.exports = router;
