const User = require('../models/User');

/**
 * One-time migration: legacy platformRole -> role; unset platformRole.
 * Uses raw collection so legacy field is visible after schema removal.
 */
module.exports.migrateUserRoles = async function migrateUserRoles() {
  try {
    const coll = User.collection;
    const raw = await coll
      .find({
        $or: [{ role: { $exists: false } }, { platformRole: { $exists: true } }],
      })
      .toArray();

    if (!raw.length) return;

    let n = 0;
    for (const doc of raw) {
      const hasValidRole = doc.role === 'admin' || doc.role === 'member';
      const role = hasValidRole
        ? doc.role
        : doc.platformRole === 'admin'
          ? 'admin'
          : 'member';
      await coll.updateOne({ _id: doc._id }, { $set: { role }, $unset: { platformRole: '' } });
      n += 1;
    }
    if (n) console.log(`[migrateUserRoles] Migrated ${n} user(s) to role field.`);
  } catch (e) {
    console.error('[migrateUserRoles]', e?.message);
  }
};
