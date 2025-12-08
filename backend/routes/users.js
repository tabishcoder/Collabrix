const express = require('express');
const { auth } = require('../middleware/auth');
const router = express.Router();

const { getMe, searchUsers } = require('../controller/user')

router.get('/me', auth, getMe);

module.exports = router;
