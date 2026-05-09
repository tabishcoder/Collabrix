const mongoose = require('mongoose');

const SOURCES = ['timer', 'manual'];

const TimeEntrySchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, default: null },
    note: { type: String, trim: true, maxlength: 500, default: '' },
    source: { type: String, enum: SOURCES, required: true },
  },
  { timestamps: true },
);

TimeEntrySchema.index({ taskId: 1, startedAt: -1 });
TimeEntrySchema.index(
  { userId: 1 },
  { unique: true, partialFilterExpression: { endedAt: null } },
);

module.exports = mongoose.model('TimeEntry', TimeEntrySchema);
module.exports.SOURCES = SOURCES;
