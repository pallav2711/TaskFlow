const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// ─── Helper ────────────────────────────────────────────────────────────────────
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: user.toPublic(),
  });
};

// ─── @route  POST /api/auth/register ──────────────────────────────────────────
// ─── @access Public
const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  if (role !== undefined && !['manager', 'developer'].includes(role)) {
    return next(new AppError('Role must be manager or developer', 422));
  }

  // Check duplicate email
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return next(new AppError('An account with this email already exists', 409));
  }

  // Only allow valid roles; default to developer
  const assignedRole = role || 'developer';

  const user = await User.create({ name, email, password, role: assignedRole });
  sendTokenResponse(user, 201, res);
});

// ─── @route  POST /api/auth/login ─────────────────────────────────────────────
// ─── @access Public
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Explicitly select password (it's excluded by default)
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    return next(new AppError('Invalid email or password', 401));
  }

  sendTokenResponse(user, 200, res);
});

// ─── @route  GET /api/auth/me ─────────────────────────────────────────────────
// ─── @access Private (requires valid JWT)
const getMe = asyncHandler(async (req, res) => {
  // req.user is already attached by protect middleware
  res.status(200).json({
    success: true,
    user: req.user.toPublic(),
  });
});

// ─── @route  PUT /api/auth/me ─────────────────────────────────────────────────
// ─── @access Private — update own profile (name, avatar)
const updateMe = asyncHandler(async (req, res, next) => {
  const allowed = ['name', 'avatar'];
  const updates = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  if (Object.keys(updates).length === 0) {
    return next(new AppError('No valid fields provided to update', 400));
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    user: user.toPublic(),
  });
});

// ─── @route  PUT /api/auth/change-password ────────────────────────────────────
// ─── @access Private
const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.matchPassword(currentPassword))) {
    return next(new AppError('Current password is incorrect', 401));
  }

  if (newPassword.length < 6) {
    return next(new AppError('New password must be at least 6 characters', 422));
  }

  user.password = newPassword;
  await user.save(); // triggers pre-save hash

  sendTokenResponse(user, 200, res);
});

module.exports = { register, login, getMe, updateMe, changePassword };
