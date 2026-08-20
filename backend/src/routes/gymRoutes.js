const express = require('express');
const authenticate = require('../middleware/authenticate');
const withGymParam = require('../middleware/withGymParam');
const requireGymOwner = require('../middleware/requireGymOwner');
const requireGymPermission = require('../middleware/requireGymPermission');
const gymController = require('../controllers/gymController');
const membershipController = require('../controllers/membershipController');
const storeController = require('../controllers/storeController');
const reviewController = require('../controllers/reviewController');
const staffController = require('../controllers/staffController');
const {
  registerGymValidators,
  listGymsValidators,
  createPlanValidators,
  joinGymValidators,
  createProductValidators,
  createOrderValidators,
  createReviewValidators,
} = require('../validators/gymValidators');
const { inviteStaffValidators, updateStaffPermissionsValidators } = require('../validators/staffValidators');

const router = express.Router();

// Every route below requires a logged-in FitLoom account. All routes with
// a :gymId param run through withGymParam FIRST (opens tenant context from
// the URL, not from the user's activeGymId) so tenantScopePlugin filters
// correctly regardless of whether the caller manages this gym or is just a
// member interacting with it.
//
// Dashboard routes use requireGymPermission(...) instead of requireGymOwner:
// the owner always passes every permission check, but this also lets a
// delegated staff account in if they've been granted that specific
// permission for this gym (see GymStaffMember / staffController). Staff
// management itself stays requireGymOwner — deliberately not delegable, so
// a staffer can never grant themselves more access than they were given.

// --- Registration & browsing ---
router.post('/', authenticate, registerGymValidators, gymController.registerGym);
router.get('/', authenticate, listGymsValidators, gymController.listGyms);
// MUST be registered before '/:gymId' below, or Express treats "mine" as a
// literal gymId value — same trap as exerciseRoutes.js's /batch route.
router.get('/mine', authenticate, gymController.getMyGyms);
router.get('/:gymId', authenticate, withGymParam, gymController.getGymDetail);

// --- Owner dashboard ---
router.get(
  '/:gymId/overview',
  authenticate,
  withGymParam,
  requireGymPermission('view_overview'),
  gymController.getGymOverview
);
router.get(
  '/:gymId/members',
  authenticate,
  withGymParam,
  requireGymPermission('manage_members'),
  gymController.getGymMembers
);
router.get('/:gymId/leaderboard', authenticate, withGymParam, gymController.getGymLeaderboard);

// --- Staff management (owner-only, deliberately not delegable) ---
router.post(
  '/:gymId/staff',
  authenticate,
  withGymParam,
  requireGymOwner,
  inviteStaffValidators,
  staffController.inviteStaff
);
router.get('/:gymId/staff', authenticate, withGymParam, requireGymOwner, staffController.listStaff);
router.patch(
  '/:gymId/staff/:staffMemberId',
  authenticate,
  withGymParam,
  requireGymOwner,
  updateStaffPermissionsValidators,
  staffController.updateStaffPermissions
);
router.delete(
  '/:gymId/staff/:staffMemberId',
  authenticate,
  withGymParam,
  requireGymOwner,
  staffController.removeStaff
);

// --- Membership plans ---
router.get('/:gymId/membership-plans', authenticate, withGymParam, membershipController.listPlans);
router.post(
  '/:gymId/membership-plans',
  authenticate,
  withGymParam,
  requireGymPermission('manage_plans'),
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
  requireGymPermission('manage_products'),
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