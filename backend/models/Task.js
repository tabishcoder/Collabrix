const mongoose = require('mongoose');

const PRIORITIES = ['none', 'low', 'medium', 'high', 'urgent'];

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
  }
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
