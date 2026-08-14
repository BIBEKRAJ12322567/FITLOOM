const { body, query, validationResult } = require('express-validator');
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

const registerGymValidators = [
  body('name').isString().trim().isLength({ min: 2, max: 100 }).withMessage('Gym name is required'),
  body('address.city').optional().isString(),
  body('address.line1').optional().isString(),
  body('contactPhone').optional().isString(),
  body('facilities').optional().isArray(),
  body('description').optional().isString().isLength({ max: 1000 }),
  runValidation,
];

const listGymsValidators = [
  query('city').optional().isString(),
  query('search').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  runValidation,
];

const createPlanValidators = [
  body('name').isString().trim().isLength({ min: 2, max: 100 }),
  body('durationDays').isInt({ min: 1, max: 3650 }),
  body('price').isFloat({ min: 0 }),
  body('features').optional().isArray(),
  runValidation,
];

const joinGymValidators = [body('planId').isMongoId().withMessage('A valid planId is required'), runValidation];

const createProductValidators = [
  body('name').isString().trim().isLength({ min: 2, max: 100 }),
  body('price').isFloat({ min: 0 }),
  body('stockQty').isInt({ min: 0 }),
  body('description').optional().isString(),
  body('category').optional().isString(),
  runValidation,
];

const createOrderValidators = [
  body('items').isArray({ min: 1 }).withMessage('items must be a non-empty array'),
  body('items.*.productId').isMongoId(),
  body('items.*.qty').isInt({ min: 1 }),
  runValidation,
];

const createReviewValidators = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('rating must be 1-5'),
  body('comment').optional().isString().isLength({ max: 1000 }),
  runValidation,
];

module.exports = {
  registerGymValidators,
  listGymsValidators,
  createPlanValidators,
  joinGymValidators,
  createProductValidators,
  createOrderValidators,
  createReviewValidators,
};