const { body, param, validationResult } = require('express-validator');
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

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/; // "HH:MM", 24-hour, zero-padded

const upsertProfileValidators = [
  body('bio').optional({ nullable: true }).isString().isLength({ max: 1000 }),
  body('specializations').optional().isArray(),
  body('specializations.*').optional().isString().trim().notEmpty(),
  body('hourlyRate').isFloat({ min: 0 }).withMessage('hourlyRate must be 0 or more'),
  body('availability').optional().isArray(),
  body('availability.*.dayOfWeek')
    .if(body('availability').exists())
    .isInt({ min: 0, max: 6 })
    .withMessage('dayOfWeek must be 0 (Sunday) through 6 (Saturday)'),
  body('availability.*.startTime')
    .if(body('availability').exists())
    .matches(TIME_REGEX)
    .withMessage('startTime must be in HH:MM 24-hour format'),
  body('availability.*.endTime')
    .if(body('availability').exists())
    .matches(TIME_REGEX)
    .withMessage('endTime must be in HH:MM 24-hour format')
    .custom((endTime, { req, path }) => {
      // path looks like "availability[0].endTime" — pull the index out to
      // find that same slot's startTime for the comparison.
      const index = path.match(/\[(\d+)\]/)?.[1];
      if (index === undefined) return true;
      const slot = req.body.availability[index];
      // "HH:MM" zero-padded strings compare correctly lexically.
      if (slot?.startTime && TIME_REGEX.test(slot.startTime) && endTime <= slot.startTime) {
        throw new Error('endTime must be after startTime for each availability slot');
      }
      return true;
    }),
  runValidation,
];

const createBookingValidators = [
  param('trainerId').isMongoId().withMessage('Invalid trainer id'),
  body('scheduledAt').isISO8601().withMessage('scheduledAt must be a valid date/time'),
  body('durationMinutes').optional().isInt({ min: 15, max: 240 }),
  body('sessionMode').isIn(['video', 'in_person']).withMessage('sessionMode must be video or in_person'),
  runValidation,
];

const updateBookingStatusValidators = [
  param('bookingId').isMongoId().withMessage('Invalid booking id'),
  body('status').isIn(['confirmed', 'completed', 'cancelled']).withMessage('Invalid status'),
  runValidation,
];

module.exports = { upsertProfileValidators, createBookingValidators, updateBookingStatusValidators };