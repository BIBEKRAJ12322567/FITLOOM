const mongoose = require('mongoose');
const { Gym, GymReview } = require('../models');

/**
 * Recomputes and stores Gym.ratingAvg/ratingCount after any review
 * create/update — denormalized the same way TrainerProfile.ratingAvg is,
 * so listGyms can sort/display ratings without an aggregation on every
 * gym-browse request.
 */
async function recalculateGymRating(gymId) {
  const stats = await GymReview.aggregate([
    { $match: { gymId } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const avg = stats[0]?.avg || 0;
  const count = stats[0]?.count || 0;

  await Gym.findByIdAndUpdate(gymId, {
    ratingAvg: Math.round(avg * 10) / 10,
    ratingCount: count,
  });
}

/**
 * POST /api/gyms/:gymId/reviews — create or update this user's review of
 * this gym (one review per user per gym, enforced by the unique index on
 * GymReview — an upsert here means "leave a review" and "edit my review"
 * are the same request, which matches how most review UIs actually behave).
 */
async function createOrUpdateReview(req, res, next) {
  try {
    const { rating, comment } = req.body;
    const gymId = new mongoose.Types.ObjectId(req.params.gymId);

    const review = await GymReview.findOneAndUpdate(
      { gymId, userId: req.user.id },
      { rating, comment },
      { new: true, upsert: true, runValidators: true }
    );

    await recalculateGymRating(gymId);

    res.status(201).json({ review });
  } catch (err) {
    next(err);
  }
}

/** GET /api/gyms/:gymId/reviews — public list of reviews for a gym. */
async function listReviews(req, res, next) {
  try {
    const reviews = await GymReview.find({ gymId: req.params.gymId })
      .populate('userId', 'profile.name')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.status(200).json({ reviews });
  } catch (err) {
    next(err);
  }
}

module.exports = { createOrUpdateReview, listReviews };