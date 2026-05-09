const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  listByTask,
  getActive,
  startTimer,
  stopTimer,
  createManual,
  updateEntry,
  deleteEntry,
} = require('../controller/timeEntries.controller');

router.get('/active', auth, getActive);
router.get('/task/:taskId', auth, listByTask);
router.post('/start', auth, startTimer);
router.post('/stop', auth, stopTimer);
router.post('/manual', auth, createManual);
router.patch('/:id', auth, updateEntry);
router.delete('/:id', auth, deleteEntry);

module.exports = router;
