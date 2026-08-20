const { DietPlan } = require('../models');

/**
 * GET /api/diet — the user's own saved/AI-generated diet plans.
 * Mirrors workoutController.listMyPlans, which already existed for
 * workout plans — diet plans were already being persisted by
 * dietPlanGeneratorService.generateDietPlan() on every generation, but
 * had no equivalent "list mine" endpoint, so a user could never see or
 * return to a diet plan they'd generated before.
 */
async function listMyPlans(req, res, next) {
  try {
    const plans = await DietPlan.find({ ownerId: req.user.id }).sort({ createdAt: -1 }).lean();
    res.status(200).json({ plans });
  } catch (err) {
    next(err);
  }
}

module.exports = { listMyPlans };