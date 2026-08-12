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

const generateWorkoutValidators = [
  body('daysPerWeek').optional().isInt({ min: 1, max: 7 }).withMessage('daysPerWeek must be 1-7'),
  body('goal')
    .optional()
    .isIn(['weight_loss', 'muscle_gain', 'general_fitness', 'strength', 'endurance'])
    .withMessage('Invalid goal'),
  body('level')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid level'),
  body('equipment').optional().isArray().withMessage('equipment must be an array of strings'),
  body('equipment.*').optional().isString(),
  body('muscleGroups').optional().isArray().withMessage('muscleGroups must be an array of strings'),
  body('notes').optional().isString().isLength({ max: 500 }).withMessage('notes must be under 500 characters'),
  runValidation,
];

module.exports = { generateWorkoutValidators };
