const User = require('../models/User');
const Space = require('../models/Space');
const Project = require('../models/Project');

/**
 * GET /api/admin/overview
 * Aggregate counts + recent workspaces (for platform dashboard).
 */
module.exports.getAdminOverview = async (req, res) => {
  try {
    const [userCount, workspaceCount, projectCount] = await Promise.all([
      User.countDocuments(),
      Space.countDocuments(),
      Project.countDocuments(),
    ]);

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
        users: userCount,
        workspaces: workspaceCount,
        projects: projectCount,
      },
      workspaces: list,
    });
  } catch (err) {
    console.error('getAdminOverview', err?.message);
    res.status(500).json({ message: err.message || 'Failed to load admin overview' });
  }
};
