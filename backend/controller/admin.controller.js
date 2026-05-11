const mongoose = require('mongoose');
const User = require('../models/User');
const Space = require('../models/Space');
const Project = require('../models/Project');
const Task = require('../models/Task');

const DAY_MS = 86400000;

function lastNDaysKeys(n) {
  const keys = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(today.getTime() - i * DAY_MS);
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

function seriesFromAgg(rows, nDays = 30) {
  const keys = lastNDaysKeys(nDays);
  const map = new Map(keys.map((k) => [k, 0]));
  for (const row of rows) {
    const k = row._id;
    if (map.has(k)) map.set(k, row.count);
  }
  return keys.map((date) => ({ date, count: map.get(date) || 0 }));
}

/**
 * GET /api/admin/overview — legacy shape + extended stats (optional use by older clients).
 */
module.exports.getAdminOverview = async (req, res) => {
  try {
    const statsDoc = await buildSystemStats();
    const workspaces = await Space.find()
      .sort({ updatedAt: -1 })
      .limit(80)
      .populate('owner', 'name email')
      .lean();

    const spaceIds = workspaces.map((s) => s._id);
    let countBySpace = new Map();
    if (spaceIds.length) {
      const projectAgg = await Project.aggregate([
        { $match: { spaceId: { $in: spaceIds } } },
        { $group: { _id: '$spaceId', count: { $sum: 1 } } },
      ]);
      countBySpace = new Map(projectAgg.map((x) => [String(x._id), x.count]));
    }

    const list = workspaces.map((w) => ({
      _id: w._id,
      name: w.name,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
      owner: w.owner ? { _id: w.owner._id, name: w.owner.name, email: w.owner.email } : null,
      memberCount: 1 + (w.members?.length || 0),
      projectCount: countBySpace.get(String(w._id)) || 0,
    }));

    res.json({
      stats: {
        users: statsDoc.users,
        workspaces: statsDoc.workspaces,
        projects: statsDoc.projects,
        tasks: statsDoc.tasks,
        activeUsers7d: statsDoc.activeUsers7d,
        inactiveUsers: statsDoc.inactiveUsers,
      },
      workspaces: list,
    });
  } catch (err) {
    console.error('getAdminOverview', err?.message);
    res.status(500).json({ message: err.message || 'Failed to load admin overview' });
  }
};

async function buildSystemStats() {
  const sevenDaysAgo = new Date(Date.now() - 7 * DAY_MS);
  const [
    userCount,
    workspaceCount,
    projectCount,
    taskCount,
    activeUsers7d,
    inactiveUsers,
  ] = await Promise.all([
    User.countDocuments(),
    Space.countDocuments(),
    Project.countDocuments(),
    Task.countDocuments(),
    User.countDocuments({ lastLoginAt: { $gte: sevenDaysAgo }, isActive: { $ne: false } }),
    User.countDocuments({ isActive: false }),
  ]);
  return {
    users: userCount,
    workspaces: workspaceCount,
    projects: projectCount,
    tasks: taskCount,
    activeUsers7d,
    inactiveUsers,
  };
}

module.exports.getSystemStats = async (req, res) => {
  try {
    const stats = await buildSystemStats();
    res.json(stats);
  } catch (err) {
    console.error('getSystemStats', err?.message);
    res.status(500).json({ message: err.message || 'Failed to load stats' });
  }
};

module.exports.getAllUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const q = (req.query.q || '').trim();

    const searchMatch = q
      ? {
          $or: [
            { email: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
            { name: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
          ],
        }
      : {};

    const [total, rows] = await Promise.all([
      User.countDocuments(searchMatch),
      User.aggregate([
        { $match: searchMatch },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: 'spaces',
            let: { uid: '$_id' },
            pipeline: [
              { $match: { $expr: { $eq: ['$owner', '$$uid'] } } },
              { $count: 'c' },
            ],
            as: 'ownedArr',
          },
        },
        {
          $lookup: {
            from: 'spaces',
            let: { uid: '$_id' },
            pipeline: [
              { $match: { $expr: { $in: ['$$uid', '$members.user'] } } },
              { $count: 'c' },
            ],
            as: 'memberArr',
          },
        },
        {
          $project: {
            name: 1,
            email: 1,
            role: 1,
            isActive: 1,
            isVerified: 1,
            createdAt: 1,
            lastLoginAt: 1,
            ownedWorkspaceCount: { $ifNull: [{ $arrayElemAt: ['$ownedArr.c', 0] }, 0] },
            workspaceMembershipCount: { $ifNull: [{ $arrayElemAt: ['$memberArr.c', 0] }, 0] },
          },
        },
      ]),
    ]);

    res.json({
      users: rows,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    console.error('getAllUsers', err?.message);
    res.status(500).json({ message: err.message || 'Failed to list users' });
  }
};

module.exports.updateAdminUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const target = await User.findById(id).select('role isActive email name');
    if (!target) return res.status(404).json({ message: 'User not found' });

    const body = req.body || {};
    const nextRole = body.role !== undefined ? body.role : target.role;
    const nextActive = body.isActive !== undefined ? Boolean(body.isActive) : target.isActive;

    if (body.role !== undefined && !['member', 'admin'].includes(body.role)) {
      return res.status(400).json({ message: 'role must be member or admin' });
    }

    const wasAdmin = target.role === 'admin';
    const willBeAdmin = nextRole === 'admin' && nextActive;

    if (wasAdmin && !willBeAdmin) {
      const otherActiveAdmins = await User.countDocuments({
        role: 'admin',
        isActive: true,
        _id: { $ne: target._id },
      });
      if (otherActiveAdmins === 0) {
        return res.status(400).json({ message: 'Cannot remove the last platform administrator.' });
      }
    }

    const updates = {};
    if (body.role !== undefined) updates.role = body.role;
    if (body.isActive !== undefined) {
      updates.isActive = nextActive;
      updates.deactivatedAt = nextActive ? null : new Date();
    }

    const updated = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, select: 'name email role isActive isVerified createdAt lastLoginAt' },
    );

    res.json(updated);
  } catch (err) {
    console.error('updateAdminUser', err?.message);
    res.status(500).json({ message: err.message || 'Failed to update user' });
  }
};

module.exports.getAllWorkspaces = async (req, res) => {
  try {
    const workspaces = await Space.find()
      .sort({ updatedAt: -1 })
      .populate('owner', 'name email')
      .lean();

    const spaceIds = workspaces.map((s) => s._id);
    let countBySpace = new Map();
    if (spaceIds.length) {
      const projectAgg = await Project.aggregate([
        { $match: { spaceId: { $in: spaceIds } } },
        { $group: { _id: '$spaceId', count: { $sum: 1 } } },
      ]);
      countBySpace = new Map(projectAgg.map((x) => [String(x._id), x.count]));
    }

    const list = workspaces.map((w) => ({
      _id: w._id,
      name: w.name,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
      owner: w.owner ? { _id: w.owner._id, name: w.owner.name, email: w.owner.email } : null,
      memberCount: 1 + (w.members?.length || 0),
      projectCount: countBySpace.get(String(w._id)) || 0,
    }));

    res.json({ workspaces: list });
  } catch (err) {
    console.error('getAllWorkspaces', err?.message);
    res.status(500).json({ message: err.message || 'Failed to list workspaces' });
  }
};

module.exports.getWorkspaceById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid workspace id' });
    }

    const space = await Space.findById(id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .lean();

    if (!space) return res.status(404).json({ message: 'Workspace not found' });

    const projects = await Project.find({ spaceId: id })
      .select('name createdAt updatedAt members tasks')
      .lean();

    const projectIds = projects.map((p) => p._id);
    let taskCountByProject = new Map();
    if (projectIds.length) {
      const agg = await Task.aggregate([
        { $match: { projectId: { $in: projectIds } } },
        { $group: { _id: '$projectId', count: { $sum: 1 } } },
      ]);
      taskCountByProject = new Map(agg.map((x) => [String(x._id), x.count]));
    }

    const projectSummaries = projects.map((p) => ({
      _id: p._id,
      name: p.name,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      memberCount: p.members?.length || 0,
      taskCount: taskCountByProject.get(String(p._id)) || 0,
    }));

    res.json({
      workspace: {
        _id: space._id,
        name: space.name,
        createdAt: space.createdAt,
        updatedAt: space.updatedAt,
        owner: space.owner,
        members: (space.members || []).map((m) => ({
          user: m.user,
          role: m.role,
          joinedAt: m.joinedAt,
        })),
      },
      projects: projectSummaries,
    });
  } catch (err) {
    console.error('getWorkspaceById', err?.message);
    res.status(500).json({ message: err.message || 'Failed to load workspace' });
  }
};

module.exports.getAnalyticsData = async (req, res) => {
  try {
    const nDays = Math.min(90, Math.max(7, parseInt(req.query.days, 10) || 30));
    const start = new Date(Date.now() - nDays * DAY_MS);

    const [userAgg, taskAgg, spaceAgg, topWorkspaces] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Task.aggregate([
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Space.aggregate([
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Task.aggregate([
        { $group: { _id: '$projectId', taskCount: { $sum: 1 } } },
        { $sort: { taskCount: -1 } },
        { $limit: 8 },
        {
          $lookup: {
            from: 'projects',
            localField: '_id',
            foreignField: '_id',
            as: 'project',
          },
        },
        { $unwind: '$project' },
        {
          $lookup: {
            from: 'spaces',
            localField: 'project.spaceId',
            foreignField: '_id',
            as: 'space',
          },
        },
        { $unwind: '$space' },
        {
          $project: {
            taskCount: 1,
            projectName: '$project.name',
            workspaceId: '$space._id',
            workspaceName: '$space.name',
          },
        },
      ]),
    ]);

    res.json({
      usersCreated: seriesFromAgg(userAgg, nDays),
      tasksCreated: seriesFromAgg(taskAgg, nDays),
      workspacesCreated: seriesFromAgg(spaceAgg, nDays),
      topWorkspacesByTasks: topWorkspaces,
    });
  } catch (err) {
    console.error('getAnalyticsData', err?.message);
    res.status(500).json({ message: err.message || 'Failed to load analytics' });
  }
};
