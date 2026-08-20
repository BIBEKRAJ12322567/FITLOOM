const express = require('express');
const { body, validationResult } = require('express-validator');
const authenticate = require('../middleware/authenticate');
const paymentController = require('../controllers/paymentController');
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

const verifyPaymentValidators = [
  body('razorpayOrderId').isString().notEmpty(),
  body('razorpayPaymentId').isString().notEmpty(),
  body('razorpaySignature').isString().notEmpty(),
  runValidation,
];

const router = express.Router();

router.post('/:paymentId/verify', authenticate, verifyPaymentValidators, paymentController.verifyPayment);

module.exports = router;