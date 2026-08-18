const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const trainerController = require('../controllers/trainerController');
const {
  upsertProfileValidators,
  createBookingValidators,
  updateBookingStatusValidators,
} = require('../validators/trainerValidators');

const router = express.Router();

// 'profile/me', 'profile', 'bookings/me', and 'bookings/incoming' MUST be
// registered before the '/:trainerId' catch-all below, or Express would
// treat e.g. "bookings" as a literal :trainerId value — same trap noted in
// exerciseRoutes.js for its /batch route.
router.get('/profile/me', authenticate, authorize('trainer'), trainerController.getMyProfile);
router.put(
  '/profile',
  authenticate,
  authorize('trainer'),
  upsertProfileValidators,
  trainerController.upsertMyProfile
);
router.get('/bookings/me', authenticate, trainerController.listMyBookingsAsClient);
router.get(
  '/bookings/incoming',
  authenticate,
  authorize('trainer'),
  trainerController.listMyBookingsAsTrainer
);
router.patch(
  '/bookings/:bookingId/status',
  authenticate,
  updateBookingStatusValidators,
  trainerController.updateBookingStatus
);

router.get('/', authenticate, trainerController.listTrainers);
router.get('/:trainerId', authenticate, trainerController.getTrainerById);
router.post(
  '/:trainerId/bookings',
  authenticate,
  createBookingValidators,
  trainerController.createBooking
);

module.exports = router;