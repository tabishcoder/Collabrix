/**
 * One-time migration: convert flat ObjectId[] members to structured {user, role} arrays.
 *
 * Safe to run multiple times (idempotent – skips already-migrated docs).
 *
 * Usage:
 *   node backend/scripts/migrate-members.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const Space   = require('../models/Space');
const Project = require('../models/Project');

const isObjectId = (v) => mongoose.Types.ObjectId.isValid(v) && typeof v !== 'object';
const alreadyMigrated = (member) => member && typeof member === 'object' && member.user;

async function migrateSpaces() {
  const spaces = await Space.find({});
  let migrated = 0;

  for (const space of spaces) {
    if (space.members.length === 0) continue;

    // Skip if already migrated (first element has a .user property)
    if (alreadyMigrated(space.members[0])) continue;

    space.members = space.members.map((m) => ({
      user:     m,
      role:     'member',
      joinedAt: space.createdAt
    }));
    await space.save();
    migrated++;
  }

  console.log(`Spaces migrated: ${migrated}`);
}

async function migrateProjects() {
  const projects = await Project.find({});
  let migrated = 0;

  for (const project of projects) {
    if (project.members.length === 0) continue;
    if (alreadyMigrated(project.members[0])) continue;

    project.members = project.members.map((m) => ({
      user:    m,
      role:    'contributor',
      addedAt: project.createdAt
    }));
    await project.save();
    migrated++;
  }

  console.log(`Projects migrated: ${migrated}`);
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await migrateSpaces();
  await migrateProjects();

  console.log('Migration complete.');
  process.exit(0);
}

run().catch((err) => { console.error(err); process.exit(1); });
