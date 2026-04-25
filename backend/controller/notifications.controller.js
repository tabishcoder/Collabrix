const Notification = require('../models/Notification');

module.exports.listNotifications = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 40, 100);
    const items = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    const unread = await Notification.countDocuments({ user: req.user._id, read: false });
    res.json({ items, unread });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports.markNotificationRead = async (req, res) => {
  try {
    const n = await Notification.findOne({ _id: req.params.id, user: req.user._id });
    if (!n) return res.status(404).json({ message: 'Not found' });
    n.read = true;
    await n.save();
    res.json(n);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { $set: { read: true } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
