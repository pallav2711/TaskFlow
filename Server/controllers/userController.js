const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// ─── @route  GET /api/users ───────────────────────────────────────────────────
// ─── @access Private — returns all users for assignee/member dropdowns
// ─── Supports: ?search=name_or_email
const getUsers = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const filter = {};

  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const users = await User.find(filter)
    .select('name email avatar role')
    .sort({ name: 1 })
    .limit(100);

  res.status(200).json({ success: true, count: users.length, data: users });
});

// ─── @route  GET /api/users/:id ──────────────────────────────────────────────
// ─── @access Private
const getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('name email avatar role createdAt');
  if (!user) return next(new AppError('User not found', 404));
  res.status(200).json({ success: true, data: user });
});

module.exports = { getUsers, getUserById };
