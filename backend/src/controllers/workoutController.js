const { WorkoutPlan, WorkoutLog, User } = require('../models');
const AppError = require('../utils/AppError');

/** GET /api/workouts — the user's own saved/AI-generated plans. */
async function listMyPlans(req, res, next) {
  try {
    const plans = await WorkoutPlan.find({ ownerId: req.user.id }).sort({ createdAt: -1 }).lean();
    res.status(200).json({ plans });
  } catch (err) {
    next(err);
  }
}

/**
 * Updates streak state on the user document. Logic: if the user already
 * logged something today, streak is unchanged (no double-counting). If
 * their last logged day was yesterday, the streak continues (+1). Any
 * larger gap breaks the streak back to 1. Kept here rather than a
 * background job — it's a cheap, synchronous update tied directly to the
 * action that should extend it.
 */
async function updateStreak(user) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const last = user.gamification?.lastActivityDate ? new Date(user.gamification.lastActivityDate) : null;
  if (last) last.setHours(0, 0, 0, 0);

  const oneDayMs = 24 * 60 * 60 * 1000;

  if (last && last.getTime() === today.getTime()) {
    return; // already logged today, streak unchanged
  }

  const isConsecutive = last && today.getTime() - last.getTime() === oneDayMs;
  const newStreak = isConsecutive ? (user.gamification?.streakDays || 0) + 1 : 1;

  await User.findByIdAndUpdate(user._id, {
    'gamification.streakDays': newStreak,
    'gamification.lastActivityDate': today,
  });
}

/** POST /api/workouts/logs — log a completed workout session. */
async function createLog(req, res, next) {
  try {
    const { planId, date, entries } = req.body;

    if (planId) {
      const plan = await WorkoutPlan.findById(planId);
      if (!plan || String(plan.ownerId) !== String(req.user.id)) {
        return next(new AppError('Workout plan not found', 404, 'NOT_FOUND'));
      }
    }

    const log = await WorkoutLog.create({
      userId: req.user.id,
      planId: planId || null,
      date: date ? new Date(date) : new Date(),
      entries,
    });

    const user = await User.findById(req.user.id);
    await updateStreak(user);
    const updatedUser = await User.findById(req.user.id).select('gamification');

    res.status(201).json({ log, streakDays: updatedUser.gamification.streakDays });
  } catch (err) {
    next(err);
  }
}

/** GET /api/workouts/logs — the user's log history, for progress charts. */
async function listLogs(req, res, next) {
  try {
    const { limit = 60 } = req.query;
    const logs = await WorkoutLog.find({ userId: req.user.id })
      .sort({ date: -1 })
      .limit(Number(limit))
      .lean();
    res.status(200).json({ logs });
  } catch (err) {
    next(err);
  }
}

module.exports = { listMyPlans, createLog, listLogs };