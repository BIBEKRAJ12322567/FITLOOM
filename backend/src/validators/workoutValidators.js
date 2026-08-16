const { body, validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

function runValidation(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const message = result
      .array()
      .map((e) => e.msg)
      .join(', ');
    return next(new AppError(message, 400, 'VALIDATION_ERROR'));
  }
  next();
}

const createLogValidators = [
  body('planId').optional().isMongoId(),
  body('date').optional().isISO8601(),
  body('entries').isArray({ min: 1 }).withMessage('entries must be a non-empty array'),
  body('entries.*.exerciseId').isMongoId().withMessage('each entry needs a valid exerciseId'),
  body('entries.*.sets').isArray({ min: 1 }).withMessage('each entry needs at least one set'),
  body('entries.*.sets.*.reps').isInt({ min: 0 }),
  body('entries.*.sets.*.weightKg').isFloat({ min: 0 }),
  runValidation,
];

module.exports = { createLogValidators };