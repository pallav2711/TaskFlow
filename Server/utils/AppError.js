/**
 * Custom operational error class that carries an HTTP status code.
 * Distinguishes intentional API errors from unexpected runtime errors.
 */
class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code (4xx / 5xx)
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // mark as known/expected error
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
