const express = require('express');
const { auth } = require('../middleware/auth');
const { queryWorkspace, summarizeText } = require('../controller/ai.controller');

const router = express.Router();

router.post('/query', auth, queryWorkspace);
router.post('/summarize', auth, summarizeText);

module.exports = router;
