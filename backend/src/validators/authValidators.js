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

const registerValidators = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('role')
    .optional()
    .isIn(['user', 'trainer', 'gym_owner'])
    .withMessage('Invalid role'), // gym_staff/admin are assigned by an admin, not self-registered
  runValidation,
];

const loginValidators = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  runValidation,
];

const refreshValidators = [
  body('refreshToken').notEmpty().withMessage('refreshToken is required'),
  runValidation,
];

// PATCH /auth/me/profile — partial update of the embedded `profile` subdocument
// only. Deliberately does NOT touch email, password, or role: those go through
// their own dedicated flows (or aren't self-service at all), so this validator
// doesn't accept them even if the client sends them (controller also ignores
// anything outside this whitelist, as defense in depth).
const profileUpdateValidators = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('avatarUrl').optional({ nullable: true }).isURL().withMessage('avatarUrl must be a valid URL'),
  body('dob').optional({ nullable: true }).isISO8601().withMessage('dob must be a valid date'),
  body('gender')
    .optional({ nullable: true })
    .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('Invalid gender'),
  body('heightCm')
    .optional({ nullable: true })
    .isFloat({ min: 50, max: 300 })
    .withMessage('heightCm must be between 50 and 300'),
  body('weightKg')
    .optional({ nullable: true })
    .isFloat({ min: 20, max: 400 })
    .withMessage('weightKg must be between 20 and 400'),
  body('goals').optional().isArray().withMessage('goals must be an array'),
  body('goals.*')
    .optional()
    .isIn(['weight_loss', 'muscle_gain', 'general_fitness', 'strength', 'endurance'])
    .withMessage('Invalid goal'),
  body('experienceLevel')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid experience level'),
  body('injuries').optional().isArray().withMessage('injuries must be an array'),
  body('injuries.*.bodyPart').if(body('injuries').exists()).notEmpty().withMessage('Each injury needs a bodyPart'),
  body('injuries.*.severity')
    .optional()
    .isIn(['mild', 'moderate', 'severe'])
    .withMessage('Invalid injury severity'),
  body('injuries.*.note').optional({ nullable: true }).isString(),
  runValidation,
];

module.exports = {
  registerValidators,
  loginValidators,
  refreshValidators,
  profileUpdateValidators,
};