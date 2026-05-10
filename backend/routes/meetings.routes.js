const express = require('express');
const multer = require('multer');
const { auth } = require('../middleware/auth');
const {
  createMeeting,
  joinMeeting,
  leaveMeeting,
  endMeeting,
  getMeetingById,
  listMeetingsForProject,
  patchMeetingTranscript,
  uploadMeetingAudio,
} = require('../controller/meetings.controller');

const router = express.Router();

const uploadAudio = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 120 * 1024 * 1024 },
});

router.get('/', auth, listMeetingsForProject);
router.post('/create', auth, createMeeting);
router.post('/:id/audio', auth, uploadAudio.single('audio'), uploadMeetingAudio);
router.patch('/:id/transcript', auth, patchMeetingTranscript);
router.post('/:id/join', auth, joinMeeting);
router.post('/:id/leave', auth, leaveMeeting);
router.post('/:id/end', auth, endMeeting);
router.get('/:id', auth, getMeetingById);

module.exports = router;
