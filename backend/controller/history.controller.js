const History = require('../models/History');
const Space = require('../models/Space');
const Project = require('../models/Project');
const Task = require('../models/Task');

// Helper function to check if user is space member
const isSpaceMember = async (spaceId, userId) => {
    const space = await Space.findById(spaceId);
    if (!space) return { allowed: false, space: null };
    const isOwner = space.owner.toString() === userId.toString();
    const isMember = space.members.some(member => member.toString() === userId.toString());
    return { allowed: isOwner || isMember, space };
};

// Helper function to check if user is project member
const isProjectMember = async (projectId, userId) => {
    const project = await Project.findById(projectId).populate('spaceId');
    if (!project) return { allowed: false, project: null, space: null };

    const space = project.spaceId;
    const isSpaceOwner = space.owner.toString() === userId.toString();
    const isSpaceMember = space.members.some(member => member.toString() === userId.toString());
    const isProjectMember = project.members.some(member => member.toString() === userId.toString());

    return {
        allowed: isSpaceOwner || isSpaceMember || isProjectMember,
        project,
        space
    };
};


module.exports.getSpaceHistory = async (req, res) => {
    try {
        const { allowed } = await isSpaceMember(req.params.spaceId, req.user._id);

        if (!allowed) {
            return res.status(403).json({ message: 'Access denied. Space member required.' });
        }

        // Get all projects in the space
        const projects = await Project.find({ spaceId: req.params.spaceId });
        const projectIds = projects.map(p => p._id);

        // Get all tasks in those projects
        const tasks = await Task.find({ projectId: { $in: projectIds } });
        const taskIds = tasks.map(t => t._id);

        // Get history for space, projects, tasks, and members
        const history = await History.find({
            $or: [
                { entityType: 'space', entityId: req.params.spaceId },
                { entityType: 'project', entityId: { $in: projectIds } },
                { entityType: 'task', entityId: { $in: taskIds } },
                { entityType: 'member', 'details.spaceId': req.params.spaceId }
            ]
        })
            .populate('performedBy', 'name email avatar')
            .sort({ timestamp: -1 })
            .limit(100);

        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports.getProjectHistory = async (req, res) => {
    try {
        const { allowed } = await isProjectMember(req.params.projectId, req.user._id);

        if (!allowed) {
            return res.status(403).json({ message: 'Access denied. Project member required.' });
        }

        // Get all tasks in the project
        const tasks = await Task.find({ projectId: req.params.projectId });
        const taskIds = tasks.map(t => t._id);

        // Get history for project, tasks, and members
        const history = await History.find({
            $or: [
                { entityType: 'project', entityId: req.params.projectId },
                { entityType: 'task', entityId: { $in: taskIds } },
                { entityType: 'member', 'details.projectId': req.params.projectId }
            ]
        })
            .populate('performedBy', 'name email avatar')
            .sort({ timestamp: -1 })
            .limit(100);

        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports.getTaskHistory = async (req, res) => {
    try {
        const task = await Task.findById(req.params.taskId).populate('projectId');

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const { allowed } = await isProjectMember(task.projectId._id, req.user._id);

        if (!allowed) {
            return res.status(403).json({ message: 'Access denied. Project member required.' });
        }

        const history = await History.find({
            entityType: 'task',
            entityId: req.params.taskId
        })
            .populate('performedBy', 'name email avatar')
            .sort({ timestamp: -1 });

        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports.getUserHistory = async (req, res) => {
    try {
        // Users can only view their own history unless they're checking another user's activity in their spaces
        if (req.params.userId !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied. Can only view own history.' });
        }

        const history = await History.find({
            performedBy: req.params.userId
        })
            .populate('performedBy', 'name email avatar')
            .sort({ timestamp: -1 })
            .limit(100);

        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}