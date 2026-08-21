const express = require('express');
const { body, validationResult } = require('express-validator');
const authenticate = require('../middleware/authenticate');
const requireAdmin = require('../middleware/requireAdmin');
const adminController = require('../controllers/adminController');
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

const suspensionValidators = [body('suspended').isBoolean().withMessage('suspended must be true/false'), runValidation];

const router = express.Router();

// Every route here requires both a valid login AND the admin role —
// applied per-route rather than router.use() so it's explicit at each
// line that this is deliberately gated, matching the style used for
// requireGymOwner/requireGymPermission elsewhere in the app.
router.get('/stats', authenticate, requireAdmin, adminController.getStats);

router.get('/users', authenticate, requireAdmin, adminController.listUsers);
router.patch(
  '/users/:userId/suspend',
  authenticate,
  requireAdmin,
  suspensionValidators,
  adminController.setUserSuspension
);

router.get('/gyms', authenticate, requireAdmin, adminController.listGyms);
router.patch(
  '/gyms/:gymId/suspend',
  authenticate,
  requireAdmin,
  suspensionValidators,
  adminController.setGymSuspension
);

router.get('/reviews', authenticate, requireAdmin, adminController.listReviews);
router.delete('/reviews/:reviewId', authenticate, requireAdmin, adminController.deleteReview);

module.exports = router;