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

module.exports = { registerValidators, loginValidators, refreshValidators };
