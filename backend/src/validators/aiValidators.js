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

const generateDietPlanValidators = [
  body('weightKg').optional().isFloat({ min: 20, max: 300 }).withMessage('weightKg must be a realistic value'),
  body('heightCm').optional().isFloat({ min: 100, max: 250 }).withMessage('heightCm must be a realistic value'),
  body('age').optional().isInt({ min: 13, max: 100 }).withMessage('age must be a realistic value'),
  body('sex').optional().isIn(['male', 'female']).withMessage('sex must be "male" or "female"'),
  body('activityLevel')
    .optional()
    .isIn(['sedentary', 'light', 'moderate', 'active', 'very_active'])
    .withMessage('Invalid activityLevel'),
  body('goal')
    .optional()
    .isIn(['weight_loss', 'muscle_gain', 'general_fitness', 'strength', 'endurance'])
    .withMessage('Invalid goal'),
  body('dietaryPreference')
    .optional()
    .isIn(['no_preference', 'vegetarian', 'vegan', 'non_vegetarian'])
    .withMessage('Invalid dietaryPreference'),
  body('cuisinePreference').optional().isString().isLength({ max: 50 }),
  body('notes').optional().isString().isLength({ max: 500 }).withMessage('notes must be under 500 characters'),
  runValidation,
];

module.exports = { generateWorkoutValidators, generateDietPlanValidators };