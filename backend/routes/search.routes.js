const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { searchWorkspace } = require('../controller/search.controller');

router.get('/', auth, searchWorkspace);

module.exports = router;
