const Invite = require('../models/Invite');
const Project = require('../models/Project');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// ─── Helper: confirm caller is project owner/manager ─────────────────────────
const assertProjectOwner = async (projectId, userId, next) => {
  const project = await Project.findById(projectId);
  if (!project) { next(new AppError('Project not found', 404)); return null; }
  if (project.owner.toString() !== userId.toString()) {
    next(new AppError('Only the project manager/owner can send invites', 403));
    return null;
  }
  return project;
};

// ─── @route  POST /api/invites ────────────────────────────────────────────────
// ─── @access Private — manager (project owner) only
// ─── Body: { projectId, email }
const sendInvite = asyncHandler(async (req, res, next) => {
  const { projectId, email } = req.body;

  // Must be manager role
  if (req.user.role !== 'manager') {
    return next(new AppError('Only managers can send project invites', 403));
  }

  const project = await assertProjectOwner(projectId, req.user._id, next);
  if (!project) return;

  // Cannot invite yourself
  if (email.toLowerCase() === req.user.email.toLowerCase()) {
    return next(new AppError('You cannot invite yourself', 400));
  }

  // Check if email already belongs to an existing member
  const targetUser = await User.findOne({ email: email.toLowerCase() });
  if (targetUser) {
    if (targetUser.role !== 'developer') {
      return next(new AppError('Project invites can only be sent to developers', 400));
    }
    const alreadyMember =
      project.owner.toString() === targetUser._id.toString() ||
      project.members.some((m) => m.toString() === targetUser._id.toString());
    if (alreadyMember) {
      return next(new AppError('This user is already a member of the project', 409));
    }
  }

  // Prevent duplicate pending invites. Reuse a previous response for re-invites.
  const existing = await Invite.findOne({
    project: projectId,
    email: email.toLowerCase(),
  });
  if (existing?.status === 'pending') {
    return next(new AppError('An invite has already been sent to this email', 409));
  }

  const invite = existing || new Invite({
    project: projectId,
    email: email.toLowerCase(),
  });
  invite.invitedBy = req.user._id;
  invite.invitedUser = targetUser?._id || null;
  invite.status = 'pending';
  await invite.save();

  await invite.populate('project', 'title color');
  await invite.populate('invitedBy', 'name email');

  res.status(201).json({ success: true, data: invite });
});

// ─── @route  GET /api/invites/sent ────────────────────────────────────────────
// ─── @access Private — manager sees invites they sent for a project
// ─── Query: ?projectId=...
const getSentInvites = asyncHandler(async (req, res, next) => {
  const { projectId } = req.query;
  if (!projectId) return next(new AppError('projectId query param is required', 400));
  if (req.user.role !== 'manager') {
    return next(new AppError('Only managers can view sent invites', 403));
  }

  const project = await assertProjectOwner(projectId, req.user._id, next);
  if (!project) return;

  const invites = await Invite.find({ project: projectId })
    .populate('invitedUser', 'name email avatar role')
    .populate('invitedBy', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: invites.length, data: invites });
});

// ─── @route  GET /api/invites/inbox ───────────────────────────────────────────
// ─── @access Private — developer sees their pending invites
const getMyInvites = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'developer') {
    return next(new AppError('Only developers can view the invite inbox', 403));
  }

  // Match by invitedUser _id OR by email (for invites sent before account existed)
  const invites = await Invite.find({
    $or: [
      { invitedUser: req.user._id, status: 'pending' },
      { email: req.user.email, status: 'pending' },
    ],
  })
    .populate('project', 'title color description')
    .populate('invitedBy', 'name email avatar')
    .sort({ createdAt: -1 });

  // Back-fill invitedUser if invite was created before user registered
  for (const inv of invites) {
    if (!inv.invitedUser) {
      inv.invitedUser = req.user._id;
      await inv.save();
    }
  }

  res.status(200).json({ success: true, count: invites.length, data: invites });
});

// ─── @route  PATCH /api/invites/:id/accept ────────────────────────────────────
// ─── @access Private — invitee only
const acceptInvite = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'developer') {
    return next(new AppError('Only developers can accept project invites', 403));
  }
  const invite = await Invite.findById(req.params.id).populate('project');

  if (!invite) return next(new AppError('Invite not found', 404));

  // Only the invitee can accept
  const isInvitee =
    (invite.invitedUser && invite.invitedUser.toString() === req.user._id.toString()) ||
    invite.email === req.user.email;

  if (!isInvitee) {
    return next(new AppError('This invite was not sent to you', 403));
  }

  if (invite.status !== 'pending') {
    return next(new AppError(`Invite is already ${invite.status}`, 400));
  }

  const project = invite.project;
  if (!project) return next(new AppError('The invited project no longer exists', 404));

  // Add user to project members if not already there
  const alreadyMember = project.members.some(
    (m) => m.toString() === req.user._id.toString()
  );
  if (!alreadyMember && project.owner.toString() !== req.user._id.toString()) {
    project.members.push(req.user._id);
    await project.save();
  }

  invite.status = 'accepted';
  invite.invitedUser = req.user._id;
  await invite.save();

  await invite.populate('project', 'title color');
  await invite.populate('invitedBy', 'name email');

  res.status(200).json({ success: true, data: invite, message: `You joined "${project.title}"` });
});

// ─── @route  PATCH /api/invites/:id/decline ───────────────────────────────────
// ─── @access Private — invitee only
const declineInvite = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'developer') {
    return next(new AppError('Only developers can decline project invites', 403));
  }
  const invite = await Invite.findById(req.params.id);
  if (!invite) return next(new AppError('Invite not found', 404));

  const isInvitee =
    (invite.invitedUser && invite.invitedUser.toString() === req.user._id.toString()) ||
    invite.email === req.user.email;

  if (!isInvitee) return next(new AppError('This invite was not sent to you', 403));
  if (invite.status !== 'pending') {
    return next(new AppError(`Invite is already ${invite.status}`, 400));
  }

  invite.status = 'declined';
  await invite.save();

  res.status(200).json({ success: true, message: 'Invite declined' });
});

// ─── @route  DELETE /api/invites/:id ─────────────────────────────────────────
// ─── @access Private — sender (manager) can cancel a pending invite
const cancelInvite = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'manager') {
    return next(new AppError('Only managers can cancel invites', 403));
  }
  const invite = await Invite.findById(req.params.id);
  if (!invite) return next(new AppError('Invite not found', 404));

  if (invite.invitedBy.toString() !== req.user._id.toString()) {
    return next(new AppError('Only the sender can cancel this invite', 403));
  }
  if (invite.status !== 'pending') {
    return next(new AppError('Can only cancel pending invites', 400));
  }

  await invite.deleteOne();
  res.status(200).json({ success: true, message: 'Invite cancelled' });
});

module.exports = {
  sendInvite,
  getSentInvites,
  getMyInvites,
  acceptInvite,
  declineInvite,
  cancelInvite,
};
