const Notification = require('../models/Notification');

const getIO = (req) => req.app.get('io');

/**
 * Persist + emit socket event to user's private room.
 */
async function createNotification(req, { userId, type, title, body, link, meta }) {
  if (!userId) return null;
  const uid = userId.toString();
  const doc = await Notification.create({
    user: uid,
    type,
    title,
    body: body || '',
    link: link || '',
    meta: meta || {},
    read: false,
  });
  const payload = doc.toObject();
  const io = getIO(req);
  if (io) {
    io.to(`user-${uid}`).emit('notification', payload);
  }
  return payload;
}

module.exports = { createNotification, getIO };
