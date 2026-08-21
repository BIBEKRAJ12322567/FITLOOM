const { User, Gym, Membership, Payment, GymReview, TrainerProfile } = require('../models');
const AppError = require('../utils/AppError');
const { recalculateGymRating } = require('./reviewController');

/**
 * GET /api/admin/stats — platform-wide counters for the admin dashboard's
 * overview tab. Revenue is summed from captured Payments only (not
 * 'created'/'failed' ones) — this is real captured revenue across every
 * gym, mock or real gateway alike, since recordMockPayment also writes
 * 'captured' rows.
 */
async function getStats(req, res, next) {
  try {
    const [totalUsers, totalGyms, activeMemberships, totalTrainers, revenueAgg] = await Promise.all([
      User.countDocuments({}),
      Gym.countDocuments({}),
      Membership.countDocuments({ status: 'active' }).setOptions({ skipTenantScope: true }),
      TrainerProfile.countDocuments({}),
      Payment.aggregate([
        { $match: { status: 'captured' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    res.status(200).json({
      totalUsers,
      totalGyms,
      activeMemberships,
      totalTrainers,
      totalRevenue: revenueAgg[0]?.total || 0,
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/admin/users — paginated, searchable user list. */
async function listUsers(req, res, next) {
  try {
    const { search, role, page = 1, limit = 25 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { email: new RegExp(search, 'i') },
        { 'profile.name': new RegExp(search, 'i') },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('email profile.name role isSuspended createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      User.countDocuments(filter),
    ]);

    res.status(200).json({ users, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/users/:userId/suspend — toggle a user's suspension.
 * Body: { suspended: boolean }. Guards against an admin suspending
 * themselves (locks them out with no way back in) or another admin
 * (platform admins shouldn't be able to silently disable each other).
 */
async function setUserSuspension(req, res, next) {
  try {
    const { suspended } = req.body;

    if (req.params.userId === req.user.id) {
      return next(new AppError("You can't suspend your own account", 422, 'CANNOT_SUSPEND_SELF'));
    }

    const target = await User.findById(req.params.userId);
    if (!target) {
      return next(new AppError('User not found', 404, 'NOT_FOUND'));
    }
    if (target.role === 'admin') {
      return next(new AppError('Admins cannot suspend other admins', 422, 'CANNOT_SUSPEND_ADMIN'));
    }

    target.isSuspended = Boolean(suspended);
    await target.save();

    res.status(200).json({ user: { _id: target._id, isSuspended: target.isSuspended } });
  } catch (err) {
    next(err);
  }
}

/** GET /api/admin/gyms — paginated, searchable gym list (includes suspended ones, unlike public browsing). */
async function listGyms(req, res, next) {
  try {
    const { search, page = 1, limit = 25 } = req.query;
    const filter = {};
    if (search) filter.name = new RegExp(search, 'i');

    const skip = (Number(page) - 1) * Number(limit);
    const [gyms, total] = await Promise.all([
      Gym.find(filter)
        .select('name slug ownerId subscriptionPlan subscriptionStatus isSuspended ratingAvg createdAt')
        .populate('ownerId', 'email profile.name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Gym.countDocuments(filter),
    ]);

    res.status(200).json({ gyms, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/gyms/:gymId/suspend — toggle a gym's suspension.
 * Body: { suspended: boolean }. A suspended gym drops out of public
 * search/browsing (gymController.listGyms filters it) and can't accept
 * new joins (membershipController.joinGym checks it) — existing members
 * and the owner's dashboard are untouched, so nothing here silently
 * deletes anyone's data.
 */
async function setGymSuspension(req, res, next) {
  try {
    const { suspended } = req.body;

    const gym = await Gym.findById(req.params.gymId);
    if (!gym) {
      return next(new AppError('Gym not found', 404, 'NOT_FOUND'));
    }

    gym.isSuspended = Boolean(suspended);
    await gym.save();

    res.status(200).json({ gym: { _id: gym._id, isSuspended: gym.isSuspended } });
  } catch (err) {
    next(err);
  }
}

/** GET /api/admin/reviews — every gym review on the platform, newest first, for moderation. */
async function listReviews(req, res, next) {
  try {
    const { page = 1, limit = 25 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total] = await Promise.all([
      GymReview.find({})
        .populate('userId', 'email profile.name')
        .populate('gymId', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      GymReview.countDocuments({}),
    ]);

    res.status(200).json({ reviews, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/admin/reviews/:reviewId — remove a review (spam, abuse,
 * off-topic). Recomputes the gym's denormalized rating afterward, same as
 * a normal review create/update does — otherwise ratingAvg/ratingCount
 * would silently drift from what GymReview actually contains.
 */
async function deleteReview(req, res, next) {
  try {
    const review = await GymReview.findByIdAndDelete(req.params.reviewId);
    if (!review) {
      return next(new AppError('Review not found', 404, 'NOT_FOUND'));
    }

    await recalculateGymRating(review.gymId);

    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getStats,
  listUsers,
  setUserSuspension,
  listGyms,
  setGymSuspension,
  listReviews,
  deleteReview,
};