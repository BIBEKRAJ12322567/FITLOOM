const express = require('express');
const authenticate = require('../middleware/authenticate');
const withGymParam = require('../middleware/withGymParam');
const requireGymOwner = require('../middleware/requireGymOwner');
const gymController = require('../controllers/gymController');
const membershipController = require('../controllers/membershipController');
const storeController = require('../controllers/storeController');
const reviewController = require('../controllers/reviewController');
const {
  registerGymValidators,
  listGymsValidators,
  createPlanValidators,
  joinGymValidators,
  createProductValidators,
  createOrderValidators,
  createReviewValidators,
} = require('../validators/gymValidators');

const router = express.Router();

// Every route below requires a logged-in FitLoom account. All routes with
// a :gymId param run through withGymParam FIRST (opens tenant context from
// the URL, not from the user's activeGymId) so tenantScopePlugin filters
// correctly regardless of whether the caller manages this gym or is just a
// member interacting with it. Owner-only routes add requireGymOwner AFTER
// that, which does the actual "do you manage this gym" authorization check.

// --- Registration & browsing ---
router.post('/', authenticate, registerGymValidators, gymController.registerGym);
router.get('/', authenticate, listGymsValidators, gymController.listGyms);
// MUST be registered before '/:gymId' below, or Express treats "mine" as a
// literal gymId value — same trap as exerciseRoutes.js's /batch route.
router.get('/mine', authenticate, gymController.getMyGyms);
router.get('/:gymId', authenticate, withGymParam, gymController.getGymDetail);

// --- Owner dashboard (requires ownership) ---
router.get('/:gymId/overview', authenticate, withGymParam, requireGymOwner, gymController.getGymOverview);
router.get('/:gymId/members', authenticate, withGymParam, requireGymOwner, gymController.getGymMembers);
router.get('/:gymId/leaderboard', authenticate, withGymParam, gymController.getGymLeaderboard);

// --- Membership plans ---
router.get('/:gymId/membership-plans', authenticate, withGymParam, membershipController.listPlans);
router.post(
  '/:gymId/membership-plans',
  authenticate,
  withGymParam,
  requireGymOwner,
  createPlanValidators,
  membershipController.createPlan
);

// --- Joining a gym (member action, any gym) ---
router.post(
  '/:gymId/memberships',
  authenticate,
  withGymParam,
  joinGymValidators,
  membershipController.joinGym
);

// --- Supplement store ---
router.get('/:gymId/products', authenticate, withGymParam, storeController.listProducts);
router.post(
  '/:gymId/products',
  authenticate,
  withGymParam,
  requireGymOwner,
  createProductValidators,
  storeController.createProduct
);
router.post(
  '/:gymId/orders',
  authenticate,
  withGymParam,
  createOrderValidators,
  storeController.createOrder
);

// --- Reviews ---
router.get('/:gymId/reviews', authenticate, withGymParam, reviewController.listReviews);
router.post(
  '/:gymId/reviews',
  authenticate,
  withGymParam,
  createReviewValidators,
  reviewController.createOrUpdateReview
);

module.exports = router;