const Chat = require('../models/Chat');

/**
 * Aligns DB indexes with Mongoose schema (e.g. after fixing directCompositeKey unique index).
 */
module.exports.syncModelIndexes = async function syncModelIndexes() {
  try {
    // Clear explicit nulls first (they broke the old unique sparse index for group/project chats).
    await Chat.collection.updateMany({ directCompositeKey: null }, { $unset: { directCompositeKey: '' } });
    await Chat.collection.updateMany({ directKey: null }, { $unset: { directKey: '' } });
    await Chat.syncIndexes();
    console.log('[syncModelIndexes] Chat indexes synced');
  } catch (e) {
    console.error('[syncModelIndexes]', e?.message);
  }
};
