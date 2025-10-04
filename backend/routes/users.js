const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// GET /api/users/me
router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash');
  res.json(user);
});

// GET /api/users?search=...
router.get('/', auth, async (req, res) => {
  const q = req.query.search || '';
  const users = await User.find({ name: q }).limit(20).select('-passwordHash');
  res.json(users);
});

module.exports = router;
