class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || 'ERROR'; // machine-readable code, e.g. 'INVALID_CREDENTIALS'
    this.isOperational = true; // distinguishes expected errors from bugs, for logging
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
