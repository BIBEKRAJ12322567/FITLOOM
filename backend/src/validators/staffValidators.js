const { body, validationResult } = require('express-validator');
const AppError = require('../utils/AppError');
const { GymStaffMember } = require('../models');

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

const PERMISSION_VALUES = GymStaffMember.STAFF_PERMISSIONS;

const inviteStaffValidators = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('permissions')
    .isArray({ min: 1 })
    .withMessage('Grant at least one permission')
    .custom((arr) => arr.every((p) => PERMISSION_VALUES.includes(p)))
    .withMessage(`permissions must be a subset of: ${PERMISSION_VALUES.join(', ')}`),
  runValidation,
];

const updateStaffPermissionsValidators = [
  body('permissions')
    .isArray({ min: 1 })
    .withMessage('Grant at least one permission')
    .custom((arr) => arr.every((p) => PERMISSION_VALUES.includes(p)))
    .withMessage(`permissions must be a subset of: ${PERMISSION_VALUES.join(', ')}`),
  runValidation,
];

module.exports = { inviteStaffValidators, updateStaffPermissionsValidators };