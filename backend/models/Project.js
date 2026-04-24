const mongoose = require('mongoose');

const ProjectMemberSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role:    { type: String, enum: ['manager', 'contributor', 'viewer'], default: 'contributor' },
  addedAt: { type: Date, default: Date.now }
}, { _id: false });

// A board column (list) – custom name + stable key + order position
const BoardColumnSchema = new mongoose.Schema({
  key:   { type: String, required: true },   // stable id used as task.status value
  name:  { type: String, required: true },   // display label
  order: { type: Number, required: true }
}, { _id: false });

const ProjectSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true },
  spaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Space', required: true },
  members: [ProjectMemberSchema],
  tasks:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  // Board columns – seeded with 3 defaults on create; managers can customise
  boardColumns: {
    type: [BoardColumnSchema],
    default: [
      { key: 'todo',        name: 'To Do',       order: 0 },
      { key: 'in_progress', name: 'In Progress',  order: 1 },
      { key: 'done',        name: 'Done',         order: 2 }
    ]
  }
}, { timestamps: true });

ProjectSchema.index({ spaceId: 1 });
ProjectSchema.index({ 'members.user': 1 });

module.exports = mongoose.model('Project', ProjectSchema);
