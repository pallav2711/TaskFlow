const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const getIdString = (value) => {
  const id = value?._id || value;
  return id?.toString();
};

// ─── Helper: verify user can access the project ───────────────────────────────
const assertProjectAccess = async (projectId, userId, next) => {
  const project = await Project.findById(projectId);
  if (!project) {
    next(new AppError('Project not found', 404));
    return null;
  }
  const id = userId.toString();
  const hasAccess =
    project.owner.toString() === id ||
    project.members.some((m) => m.toString() === id);
  if (!hasAccess) {
    next(new AppError('You do not have access to this project', 403));
    return null;
  }
  return project;
};

// ─── @route  GET /api/tasks ───────────────────────────────────────────────────
// ─── @access Private
// ─── Query params: project, status, priority, assignee, search, sortBy, order, page, limit
const getTasks = asyncHandler(async (req, res, next) => {
  const {
    project,
    status,
    priority,
    assignee,
    search,
    sortBy = 'createdAt',
    order = 'desc',
    page = 1,
    limit = 50,
  } = req.query;

  // Build base filter: tasks in projects the user belongs to
  const accessibleProjects = await Project.find({
    $or: [{ owner: req.user._id }, { members: req.user._id }],
  }).select('_id');
  const accessibleIds = accessibleProjects.map((p) => p._id);

  const filter = { project: { $in: accessibleIds } };

  // Optional filters
  if (project) {
    if (!mongoose.Types.ObjectId.isValid(project)) {
      return next(new AppError('Invalid project ID', 400));
    }
    // Confirm the requested project is accessible
    if (!accessibleIds.some((id) => id.toString() === project)) {
      return next(new AppError('You do not have access to this project', 403));
    }
    filter.project = project;
  }

  if (status) {
    const validStatuses = ['To Do', 'In Progress', 'In Review', 'Done'];
    const statusList = status.split(',').map((s) => s.trim());
    const invalid = statusList.find((s) => !validStatuses.includes(s));
    if (invalid) return next(new AppError(`Invalid status: ${invalid}`, 400));
    filter.status = { $in: statusList };
  }

  if (priority) {
    const validPriorities = ['Low', 'Medium', 'High', 'Urgent'];
    const priorityList = priority.split(',').map((p) => p.trim());
    const invalid = priorityList.find((p) => !validPriorities.includes(p));
    if (invalid) return next(new AppError(`Invalid priority: ${invalid}`, 400));
    filter.priority = { $in: priorityList };
  }

  if (assignee) {
    if (!mongoose.Types.ObjectId.isValid(assignee)) {
      return next(new AppError('Invalid assignee ID', 400));
    }
    filter.assignee = assignee;
  }

  // Full-text search on title + description (uses text index)
  if (search && search.trim()) {
    filter.$text = { $search: search.trim() };
  }

  // Sorting
  const allowedSorts = ['createdAt', 'updatedAt', 'dueDate', 'priority', 'title'];
  const sortField = allowedSorts.includes(sortBy) ? sortBy : 'createdAt';
  const sortOrder = order === 'asc' ? 1 : -1;
  const sortObj = {};

  // Priority sort: map to numeric weight for meaningful ordering
  if (sortField === 'priority') {
    // Use aggregation pipeline for weighted sort
    const priorityWeight = { $switch: {
      branches: [
        { case: { $eq: ['$priority', 'Urgent'] }, then: 4 },
        { case: { $eq: ['$priority', 'High'] }, then: 3 },
        { case: { $eq: ['$priority', 'Medium'] }, then: 2 },
        { case: { $eq: ['$priority', 'Low'] }, then: 1 },
      ],
      default: 0,
    }};

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [tasks, total] = await Promise.all([
      Task.aggregate([
        { $match: filter },
        { $addFields: { priorityWeight } },
        { $sort: { priorityWeight: sortOrder, createdAt: -1 } },
        { $skip: skip },
        { $limit: limitNum },
        {
          $lookup: {
            from: 'users', localField: 'assignee', foreignField: '_id',
            as: 'assignee',
          },
        },
        { $unwind: { path: '$assignee', preserveNullAndEmpty: true } },
        {
          $lookup: {
            from: 'projects', localField: 'project', foreignField: '_id',
            as: 'project',
          },
        },
        { $unwind: '$project' },
        {
          $lookup: {
            from: 'users', localField: 'createdBy', foreignField: '_id',
            as: 'createdBy',
          },
        },
        { $unwind: '$createdBy' },
        {
          $project: {
            title: 1,
            description: 1,
            priority: 1,
            status: 1,
            assignee: { _id: 1, name: 1, email: 1, avatar: 1, role: 1 },
            project: { _id: 1, title: 1, color: 1, owner: 1 },
            dueDate: 1,
            createdBy: { _id: 1, name: 1, email: 1, avatar: 1 },
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ]),
      Task.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: tasks.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: tasks,
    });
  }

  sortObj[sortField] = sortOrder;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate('assignee', 'name email avatar')
      .populate('project', 'title color owner')
      .populate('createdBy', 'name email avatar')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum),
    Task.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: tasks.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: tasks,
  });
});

// ─── @route  POST /api/tasks ──────────────────────────────────────────────────
// ─── @access Private — manager (project owner) only
const createTask = asyncHandler(async (req, res, next) => {
  const { title, description, priority, status, assignee, project, dueDate } = req.body;

  // Only managers can create tasks
  if (req.user.role !== 'manager') {
    return next(new AppError('Only managers can create tasks', 403));
  }

  const proj = await assertProjectAccess(project, req.user._id, next);
  if (!proj) return;
  if (proj.owner.toString() !== req.user._id.toString()) {
    return next(new AppError('Only the project owner can create tasks', 403));
  }

  // Validate assignee is project member/owner
  if (assignee) {
    const assigneeId = assignee.toString();
    const isProjectMember =
      proj.owner.toString() === assigneeId ||
      proj.members.some((m) => m.toString() === assigneeId);
    if (!isProjectMember) {
      return next(new AppError('Assignee must be a member of the project', 400));
    }
  }

  const task = await Task.create({
    title,
    description,
    priority,
    status,
    assignee: assignee || null,
    project,
    dueDate: dueDate || null,
    createdBy: req.user._id,
  });

  await task.populate('assignee', 'name email avatar role');
  await task.populate('project', 'title color owner');
  await task.populate('createdBy', 'name email avatar');

  res.status(201).json({ success: true, data: task });
});

// ─── @route  GET /api/tasks/:id ───────────────────────────────────────────────
// ─── @access Private
const getTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id)
    .populate('assignee', 'name email avatar')
    .populate('project', 'title color owner members')
    .populate('createdBy', 'name email avatar');

  if (!task) return next(new AppError('Task not found', 404));

  // Check project access
  const proj = task.project;
  const userId = getIdString(req.user._id);
  const hasAccess =
    getIdString(proj.owner) === userId ||
    proj.members.some((member) => getIdString(member) === userId);

  if (!hasAccess) {
    return next(new AppError('You do not have access to this task', 403));
  }

  res.status(200).json({ success: true, data: task });
});

// ─── @route  PUT /api/tasks/:id ───────────────────────────────────────────────
// ─── Manager: can edit all fields. Developer: can only update status of own assigned tasks.
const updateTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id).populate('project', 'owner members');
  if (!task) return next(new AppError('Task not found', 404));

  const proj = task.project;
  const userId = req.user._id.toString();
  const isProjectOwner = proj.owner.toString() === userId;
  const isProjectMember = proj.members.some((m) => m.toString() === userId);

  if (!isProjectOwner && !isProjectMember) {
    return next(new AppError('You do not have access to this task', 403));
  }

  // Developer can only update status, and only on tasks assigned to them
  if (req.user.role === 'developer') {
    const isAssignee =
      task.assignee && task.assignee.toString() === userId;
    if (!isAssignee) {
      return next(new AppError('Developers can only update tasks assigned to them', 403));
    }
    const fields = Object.keys(req.body);
    if (fields.length !== 1 || fields[0] !== 'status' || !req.body.status) {
      return next(new AppError('Developers can only update task status', 403));
    }
    task.status = req.body.status;
    await task.save({ runValidators: true });
    await task.populate('assignee', 'name email avatar role');
    await task.populate('project', 'title color owner');
    await task.populate('createdBy', 'name email avatar');
    return res.status(200).json({ success: true, data: task });
  }

  if (req.user.role !== 'manager' || !isProjectOwner) {
    return next(new AppError('Only the project manager/owner can edit tasks', 403));
  }

  // Manager/project owner: full update
  if (req.body.assignee) {
    const assigneeId = req.body.assignee.toString();
    const isProjectMemberCheck =
      proj.owner.toString() === assigneeId ||
      proj.members.some((m) => m.toString() === assigneeId);
    if (!isProjectMemberCheck) {
      return next(new AppError('Assignee must be a member of the project', 400));
    }
  }

  const allowed = ['title', 'description', 'priority', 'status', 'assignee', 'dueDate'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) task[field] = req.body[field];
  });

  await task.save({ runValidators: true });
  await task.populate('assignee', 'name email avatar role');
  await task.populate('project', 'title color owner');
  await task.populate('createdBy', 'name email avatar');

  res.status(200).json({ success: true, data: task });
});

// ─── @route  PATCH /api/tasks/:id/status ─────────────────────────────────────
// ─── Developer: own assigned tasks only. Manager: project owner only.
const updateTaskStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  const validStatuses = ['To Do', 'In Progress', 'In Review', 'Done'];

  if (!status || !validStatuses.includes(status)) {
    return next(new AppError(`Status must be one of: ${validStatuses.join(', ')}`, 422));
  }

  const task = await Task.findById(req.params.id).populate('project', 'owner members');
  if (!task) return next(new AppError('Task not found', 404));

  const proj = task.project;
  const userId = req.user._id.toString();
  const isProjectOwner = proj.owner.toString() === userId;
  const isProjectMember = proj.members.some((m) => m.toString() === userId);

  if (!isProjectOwner && !isProjectMember) {
    return next(new AppError('You do not have access to this task', 403));
  }

  // Developers can only update status of tasks assigned to them.
  if (req.user.role === 'developer') {
    const isAssignee = task.assignee && task.assignee.toString() === userId;
    if (!isAssignee) {
      return next(new AppError('Developers can only update status of tasks assigned to them', 403));
    }
  } else if (req.user.role !== 'manager' || !isProjectOwner) {
    return next(new AppError('Only the project manager/owner can update task status', 403));
  }

  task.status = status;
  await task.save();
  await task.populate('assignee', 'name email avatar role');
  await task.populate('project', 'title color owner');

  res.status(200).json({ success: true, data: task });
});

// ─── @route  DELETE /api/tasks/:id ───────────────────────────────────────────
// ─── Manager (project owner) only — developers cannot delete tasks
const deleteTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id).populate('project', 'owner members');
  if (!task) return next(new AppError('Task not found', 404));

  const proj = task.project;
  const userId = req.user._id.toString();
  const isProjectOwner = proj.owner.toString() === userId;

  if (req.user.role !== 'manager' || !isProjectOwner) {
    return next(new AppError('Only the project manager/owner can delete tasks', 403));
  }

  await task.deleteOne();
  res.status(200).json({ success: true, message: 'Task deleted successfully' });
});

module.exports = {
  getTasks,
  createTask,
  getTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
};
