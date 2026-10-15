const Project = require('../models/Project');
const Task = require('../models/Task');
const Invite = require('../models/Invite');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// ─── Helper: check if user is owner or member ─────────────────────────────────
const getIdString = (value) => {
  const id = value?._id || value;
  return id?.toString();
};

const isMemberOrOwner = (project, userId) => {
  const id = getIdString(userId);
  return (
    getIdString(project.owner) === id ||
    project.members.some((member) => getIdString(member) === id)
  );
};

// ─── @route  GET /api/projects ────────────────────────────────────────────────
// ─── @access Private — returns projects owned by OR member of current user
const getProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({
    $or: [{ owner: req.user._id }, { members: req.user._id }],
  })
    .populate('owner', 'name email avatar')
    .populate('members', 'name email avatar')
    .populate('taskCount')
    .sort({ updatedAt: -1 });

  res.status(200).json({ success: true, count: projects.length, data: projects });
});

// ─── @route  POST /api/projects ───────────────────────────────────────────────
// ─── @access Private
const createProject = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'manager') {
    return next(new AppError('Only managers can create projects', 403));
  }

  const { title, description, status, color } = req.body;

  const project = await Project.create({
    title,
    description,
    status,
    color,
    owner: req.user._id,
    members: [],
  });

  await project.populate('owner', 'name email avatar');
  await project.populate('members', 'name email avatar');

  res.status(201).json({ success: true, data: project });
});

// ─── @route  GET /api/projects/:id ───────────────────────────────────────────
// ─── @access Private — owner or member only
const getProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id)
    .populate('owner', 'name email avatar')
    .populate('members', 'name email avatar')
    .populate('taskCount');

  if (!project) return next(new AppError('Project not found', 404));

  if (!isMemberOrOwner(project, req.user._id)) {
    return next(new AppError('You do not have access to this project', 403));
  }

  res.status(200).json({ success: true, data: project });
});

// ─── @route  PUT /api/projects/:id ───────────────────────────────────────────
// ─── @access Private — owner only
const updateProject = asyncHandler(async (req, res, next) => {
  let project = await Project.findById(req.params.id);
  if (!project) return next(new AppError('Project not found', 404));

  if (req.user.role !== 'manager' || project.owner.toString() !== req.user._id.toString()) {
    return next(new AppError('Only the project owner can update this project', 403));
  }

  const allowed = ['title', 'description', 'status', 'color'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) project[field] = req.body[field];
  });

  await project.save({ runValidators: true });
  await project.populate('owner', 'name email avatar');
  await project.populate('members', 'name email avatar');

  res.status(200).json({ success: true, data: project });
});

// ─── @route  DELETE /api/projects/:id ────────────────────────────────────────
// ─── @access Private — owner only
const deleteProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) return next(new AppError('Project not found', 404));

  if (req.user.role !== 'manager' || project.owner.toString() !== req.user._id.toString()) {
    return next(new AppError('Only the project owner can delete this project', 403));
  }

  // Cascade-delete all tasks belonging to this project
  await Task.deleteMany({ project: project._id });
  await Invite.deleteMany({ project: project._id });
  await project.deleteOne();

  res.status(200).json({ success: true, message: 'Project and all its tasks deleted' });
});

// ─── @route  DELETE /api/projects/:id/members/:userId ────────────────────────
// ─── @access Private — owner only
const removeMember = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) return next(new AppError('Project not found', 404));

  if (req.user.role !== 'manager' || project.owner.toString() !== req.user._id.toString()) {
    return next(new AppError('Only the project owner can remove members', 403));
  }

  const memberIndex = project.members.findIndex(
    (m) => m.toString() === req.params.userId
  );
  if (memberIndex === -1) {
    return next(new AppError('User is not a member of this project', 404));
  }

  project.members.splice(memberIndex, 1);
  await project.save();
  await project.populate('owner', 'name email avatar');
  await project.populate('members', 'name email avatar');

  res.status(200).json({ success: true, data: project });
});

module.exports = {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  removeMember,
};
