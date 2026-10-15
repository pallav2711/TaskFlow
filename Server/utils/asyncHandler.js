/**
 * Wraps an async route handler so that any rejected promise
 * is forwarded to Express's next(err) without try/catch boilerplate.
 *
 * @param {Function} fn - async (req, res, next) handler
 * @returns {Function} express middleware
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
