const Task = require('../models/Task');
const TimeEntry = require('../models/TimeEntry');
const { getProjectRole, PROJECT_WRITE_ROLES } = require('../utils/rbac');

const MAX_NOTE_LENGTH = 500;
/** Single entry span cap (manual or corrected intervals) — 14 days */
const MAX_ENTRY_DURATION_MS = 14 * 24 * 60 * 60 * 1000;

const populateEntryUser = (query) =>
  query.populate('userId', 'name email avatar');

const populateEntryTask = (query) =>
  query.populate('taskId', 'title projectId');

function serializeEntry(doc) {
  if (!doc) return null;
  const e = doc.toObject ? doc.toObject() : { ...doc };
  const start = new Date(e.startedAt).getTime();
  const end = e.endedAt ? new Date(e.endedAt).getTime() : null;
  let durationSeconds = null;
  let runningSeconds = null;
  if (end != null && !Number.isNaN(end)) {
    durationSeconds = Math.max(0, Math.floor((end - start) / 1000));
  } else if (!Number.isNaN(start)) {
    runningSeconds = Math.max(0, Math.floor((Date.now() - start) / 1000));
  }
  return {
    ...e,
    durationSeconds,
    ...(runningSeconds != null ? { runningSeconds } : {}),
  };
}

async function loadTaskAndRequireMember(taskId, userId) {
  const task = await Task.findById(taskId).populate('projectId');
  if (!task) return { error: { status: 404, message: 'Task not found' }, task: null };
  const { role } = await getProjectRole(task.projectId._id, userId);
  if (!role) return { error: { status: 403, message: 'Access denied.' }, task: null };
  return { error: null, task };
}

function assertWrite(role, res) {
  if (!PROJECT_WRITE_ROLES.includes(role)) {
    res.status(403).json({ message: 'Access denied. Contributor or above required.' });
    return false;
  }
  return true;
}

function validateInterval(startedAt, endedAt) {
  if (!(startedAt instanceof Date) || Number.isNaN(startedAt.getTime())) {
    return 'startedAt must be a valid date';
  }
  if (!(endedAt instanceof Date) || Number.isNaN(endedAt.getTime())) {
    return 'endedAt must be a valid date';
  }
  if (startedAt > endedAt) {
    return 'startedAt must be before endedAt';
  }
  if (endedAt.getTime() - startedAt.getTime() > MAX_ENTRY_DURATION_MS) {
    return `Interval cannot exceed ${MAX_ENTRY_DURATION_MS / (24 * 60 * 60 * 1000)} days`;
  }
  return null;
}

module.exports.listByTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { error, task } = await loadTaskAndRequireMember(taskId, req.user._id);
    if (error) return res.status(error.status).json({ message: error.message });

    const docs = await populateEntryUser(
      TimeEntry.find({ taskId }).sort({ startedAt: -1 }),
    );
    let totalSeconds = 0;
    const entries = docs.map((d) => {
      const json = serializeEntry(d);
      if (json.durationSeconds != null) totalSeconds += json.durationSeconds;
      return json;
    });

    res.json({ entries, totalSeconds });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports.getActive = async (req, res) => {
  try {
    const doc = await populateEntryTask(
      populateEntryUser(
        TimeEntry.findOne({ userId: req.user._id, endedAt: null }),
      ),
    );
    if (!doc) return res.json({ entry: null });

    const taskId = doc.taskId?._id || doc.taskId;
    if (!taskId) return res.json({ entry: serializeEntry(doc) });

    const { role } = await getProjectRole(doc.taskId.projectId, req.user._id);
    if (!role) return res.status(403).json({ message: 'Access denied.' });

    res.json({ entry: serializeEntry(doc) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports.startTimer = async (req, res) => {
  try {
    const { taskId } = req.body;
    if (!taskId) return res.status(400).json({ message: 'taskId is required' });

    const { error, task } = await loadTaskAndRequireMember(taskId, req.user._id);
    if (error) return res.status(error.status).json({ message: error.message });

    const { role } = await getProjectRole(task.projectId._id, req.user._id);
    if (!assertWrite(role, res)) return;

    const now = new Date();
    await TimeEntry.updateMany(
      { userId: req.user._id, endedAt: null },
      { $set: { endedAt: now } },
    );

    const created = await TimeEntry.create({
      taskId,
      userId: req.user._id,
      startedAt: now,
      endedAt: null,
      note: '',
      source: 'timer',
    });
    const populated = await populateEntryTask(
      populateEntryUser(TimeEntry.findById(created._id)),
    );

    res.status(201).json(serializeEntry(populated));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports.stopTimer = async (req, res) => {
  try {
    const optionalTaskId = req.body?.taskId;

    const doc = await TimeEntry.findOne({ userId: req.user._id, endedAt: null }).populate({
      path: 'taskId',
      select: 'projectId',
    });
    if (!doc) return res.status(400).json({ message: 'No active timer' });

    if (optionalTaskId && doc.taskId._id.toString() !== String(optionalTaskId)) {
      return res.status(400).json({ message: 'Active timer is on a different task' });
    }

    const { role } = await getProjectRole(doc.taskId.projectId, req.user._id);
    if (!assertWrite(role, res)) return;

    doc.endedAt = new Date();
    await doc.save();

    const populated = await populateEntryTask(populateEntryUser(TimeEntry.findById(doc._id)));
    res.json(serializeEntry(populated));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports.createManual = async (req, res) => {
  try {
    const { taskId, startedAt: startedRaw, endedAt: endedRaw, note } = req.body;
    if (!taskId || startedRaw === undefined || endedRaw === undefined) {
      return res.status(400).json({ message: 'taskId, startedAt, and endedAt are required' });
    }

    const { error, task } = await loadTaskAndRequireMember(taskId, req.user._id);
    if (error) return res.status(error.status).json({ message: error.message });

    const { role } = await getProjectRole(task.projectId._id, req.user._id);
    if (!assertWrite(role, res)) return;

    const startedAt = new Date(startedRaw);
    const endedAt = new Date(endedRaw);
    const intervalErr = validateInterval(startedAt, endedAt);
    if (intervalErr) return res.status(400).json({ message: intervalErr });

    let noteStr = typeof note === 'string' ? note.trim() : '';
    if (noteStr.length > MAX_NOTE_LENGTH) {
      return res.status(400).json({ message: `note max length is ${MAX_NOTE_LENGTH}` });
    }

    const created = await TimeEntry.create({
      taskId,
      userId: req.user._id,
      startedAt,
      endedAt,
      note: noteStr,
      source: 'manual',
    });
    const populated = await populateEntryTask(
      populateEntryUser(TimeEntry.findById(created._id)),
    );

    res.status(201).json(serializeEntry(populated));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports.updateEntry = async (req, res) => {
  try {
    const doc = await TimeEntry.findById(req.params.id).populate({
      path: 'taskId',
      select: 'projectId',
    });
    if (!doc) return res.status(404).json({ message: 'Entry not found' });

    if (doc.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own time entries' });
    }

    const { role } = await getProjectRole(doc.taskId.projectId, req.user._id);
    if (!assertWrite(role, res)) return;

    const { startedAt: startedRaw, endedAt: endedRaw, note } = req.body;

    if (startedRaw !== undefined) doc.startedAt = new Date(startedRaw);
    if (endedRaw !== undefined) doc.endedAt = endedRaw === null ? null : new Date(endedRaw);
    if (note !== undefined) {
      const noteStr = typeof note === 'string' ? note.trim() : '';
      if (noteStr.length > MAX_NOTE_LENGTH) {
        return res.status(400).json({ message: `note max length is ${MAX_NOTE_LENGTH}` });
      }
      doc.note = noteStr;
    }

    if (doc.endedAt === null) {
      const other = await TimeEntry.findOne({
        userId: req.user._id,
        endedAt: null,
        _id: { $ne: doc._id },
      });
      if (other) {
        return res.status(400).json({
          message: 'Another timer is already running. Stop it before opening this entry.',
        });
      }
      if (Number.isNaN(doc.startedAt.getTime())) {
        return res.status(400).json({ message: 'startedAt must be valid' });
      }
      if (doc.startedAt > new Date()) {
        return res.status(400).json({ message: 'startedAt cannot be in the future for a running timer' });
      }
    } else {
      const intervalErr = validateInterval(doc.startedAt, doc.endedAt);
      if (intervalErr) return res.status(400).json({ message: intervalErr });
    }

    await doc.save();

    const populated = await populateEntryTask(populateEntryUser(TimeEntry.findById(doc._id)));
    res.json(serializeEntry(populated));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports.deleteEntry = async (req, res) => {
  try {
    const doc = await TimeEntry.findById(req.params.id).populate({
      path: 'taskId',
      select: 'projectId',
    });
    if (!doc) return res.status(404).json({ message: 'Entry not found' });

    if (doc.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own time entries' });
    }

    const { role } = await getProjectRole(doc.taskId.projectId, req.user._id);
    if (!assertWrite(role, res)) return;

    await TimeEntry.deleteOne({ _id: doc._id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
