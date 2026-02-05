const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema({
  entityType: {
    type: String,
    enum: ['task', 'project', 'member', 'space'],
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'entityType'
  },
  action: {
    type: String,
    enum: ['created', 'updated', 'moved', 'deleted', 'assigned', 'added', 'removed'],
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

// Index for efficient queries
HistorySchema.index({ entityType: 1, entityId: 1 });
HistorySchema.index({ performedBy: 1 });
HistorySchema.index({ timestamp: -1 });

module.exports = mongoose.model('History', HistorySchema);
