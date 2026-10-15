const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');

// ─── @route  GET /api/dashboard/stats ────────────────────────────────────────
// ─── @access Private
const getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // ── 1. Find all projects accessible to the user ──────────────────────────
  const accessibleProjects = await Project.find({
    $or: [{ owner: userId }, { members: userId }],
  }).select('_id title color status');

  const projectIds = accessibleProjects.map((p) => p._id);

  // ── 2. Task counts by status ──────────────────────────────────────────────
  const statusAgg = await Task.aggregate([
    { $match: { project: { $in: projectIds } } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const statusMap = { 'To Do': 0, 'In Progress': 0, 'In Review': 0, Done: 0 };
  statusAgg.forEach(({ _id, count }) => {
    if (_id in statusMap) statusMap[_id] = count;
  });

  const totalTasks =
    statusMap['To Do'] +
    statusMap['In Progress'] +
    statusMap['In Review'] +
    statusMap['Done'];

  // ── 3. Task counts by priority ────────────────────────────────────────────
  const priorityAgg = await Task.aggregate([
    { $match: { project: { $in: projectIds } } },
    { $group: { _id: '$priority', count: { $sum: 1 } } },
  ]);

  const priorityMap = { Low: 0, Medium: 0, High: 0, Urgent: 0 };
  priorityAgg.forEach(({ _id, count }) => {
    if (_id in priorityMap) priorityMap[_id] = count;
  });

  // ── 4. Overdue tasks count ─────────────────────────────────────────────────
  const overdueCount = await Task.countDocuments({
    project: { $in: projectIds },
    status: { $ne: 'Done' },
    dueDate: { $lt: new Date() },
  });

  // ── 5. Project progress (% done per project) ──────────────────────────────
  const projectProgress = await Task.aggregate([
    { $match: { project: { $in: projectIds } } },
    {
      $group: {
        _id: '$project',
        total: { $sum: 1 },
        done: {
          $sum: { $cond: [{ $eq: ['$status', 'Done'] }, 1, 0] },
        },
      },
    },
  ]);

  const progressMap = {};
  projectProgress.forEach(({ _id, total, done }) => {
    progressMap[_id.toString()] = {
      total,
      done,
      percentage: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  });

  const projectsWithProgress = accessibleProjects.map((p) => ({
    _id: p._id,
    title: p.title,
    color: p.color,
    status: p.status,
    ...(progressMap[p._id.toString()] || { total: 0, done: 0, percentage: 0 }),
  }));

  // ── 6. Recently updated tasks (last 8) ────────────────────────────────────
  const recentTasks = await Task.find({ project: { $in: projectIds } })
    .sort({ updatedAt: -1 })
    .limit(8)
    .populate('assignee', 'name email avatar')
    .populate('project', 'title color')
    .select('title status priority dueDate updatedAt assignee project');

  // ── 7. My tasks (assigned to current user) breakdown ─────────────────────
  const myTasksAgg = await Task.aggregate([
    {
      $match: {
        project: { $in: projectIds },
        assignee: new mongoose.Types.ObjectId(userId),
      },
    },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const myTasksMap = { 'To Do': 0, 'In Progress': 0, 'In Review': 0, Done: 0 };
  myTasksAgg.forEach(({ _id, count }) => {
    if (_id in myTasksMap) myTasksMap[_id] = count;
  });

  res.status(200).json({
    success: true,
    data: {
      tasks: {
        total: totalTasks,
        byStatus: statusMap,
        byPriority: priorityMap,
        overdue: overdueCount,
      },
      myTasks: {
        byStatus: myTasksMap,
        total: Object.values(myTasksMap).reduce((a, b) => a + b, 0),
      },
      projects: {
        total: accessibleProjects.length,
        list: projectsWithProgress,
      },
      recentTasks,
    },
  });
});

module.exports = { getDashboardStats };
