const mongoose = require('mongoose');

const SpaceMemberSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role:     { type: String, enum: ['admin', 'member'], default: 'member' },
  joinedAt: { type: Date, default: Date.now }
}, { _id: false });

const SpaceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  // owner is the creator / highest authority; NOT duplicated in members[]
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [SpaceMemberSchema]
}, { timestamps: true });

SpaceSchema.index({ owner: 1 });
SpaceSchema.index({ 'members.user': 1 });

module.exports = mongoose.model('Space', SpaceSchema);
