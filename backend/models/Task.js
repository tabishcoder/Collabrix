const mongoose = require('mongoose');

const PRIORITIES = ['none', 'low', 'medium', 'high', 'urgent'];

const TaskCommentSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 8000 },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  priority: {
    type: String,
    enum: PRIORITIES,
    default: 'none'
  },
  dueDate: {
    type: Date,
    default: null
  },
  labels: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    default: 'todo'
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  comments: {
    type: [TaskCommentSchema],
    default: [],
  },
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
