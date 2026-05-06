const Project = require('../models/Project');
const Task = require('../models/Task');
const { getSpaceRole } = require('../utils/rbac');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * GET /api/search?spaceId=&q=
 * Search project names and task titles/descriptions within a workspace.
 */
module.exports.searchWorkspace = async (req, res) => {
  try {
    const { spaceId, q } = req.query;
    if (!spaceId || !q || !String(q).trim()) {
      return res.status(400).json({ message: 'spaceId and q are required' });
    }

    const { role } = await getSpaceRole(spaceId, req.user._id);
    if (!role) return res.status(403).json({ message: 'Access denied.' });

    const term = escapeRegex(String(q).trim().slice(0, 80));
    if (!term) return res.json({ projects: [], tasks: [] });

    const regex = new RegExp(term, 'i');

    const projects = await Project.find({ spaceId, name: regex })
      .select('name spaceId')
      .sort({ updatedAt: -1 })
      .limit(15)
      .lean();

    const projectIds = await Project.find({ spaceId }).distinct('_id');
    const tasks = await Task.find({
      projectId: { $in: projectIds },
      $or: [{ title: regex }, { description: regex }],
    })
      .select('title status projectId')
      .populate('projectId', 'name')
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean();

    res.json({ projects, tasks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
