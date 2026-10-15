const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * Reads express-validator results and short-circuits with a 422
 * if any validation rules failed.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Collect all messages into a single readable string
    const messages = errors.array().map((e) => e.msg);
    const err = new AppError(messages[0], 422);
    err.errors = errors.array(); // attach full list for frontend field-level display
    return next(err);
  }
  next();
};

module.exports = validate;
