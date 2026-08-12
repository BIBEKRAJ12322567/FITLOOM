const { User, Exercise, WorkoutPlan } = require('../../models');
const AppError = require('../../utils/AppError');
const aiClient = require('./aiClient');
const logic = require('./workoutGeneratorLogic');

/**
 * Retrieval-then-generate: query real exercises from the DB first (already
 * filtered for the user's injuries, level, and equipment), then only let the
 * AI choose among and sequence those — rather than trusting a free-form AI
 * response to invent exercises or respect injury constraints on its own.
 */
async function selectCandidateExercises(user, options) {
  const filter = logic.buildCandidateFilter(user, options);
  const groups = logic.muscleGroupsToQuery(options);
  const perGroupLimit = 8;

  const results = await Promise.all(
    groups.map((group) =>
      Exercise.find({ ...filter, muscleGroups: group }).limit(perGroupLimit).lean()
    )
  );

  const merged = new Map();
  results.flat().forEach((ex) => merged.set(String(ex._id), ex));
  return Array.from(merged.values()).map(logic.toPromptCandidate);
}

async function generateWorkoutPlan(userId, options = {}) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  const candidates = await selectCandidateExercises(user, options);
  if (candidates.length < 4) {
    // Fewer than this and the AI genuinely cannot build a sane multi-day
    // split — surface it as an actionable error rather than a weird plan.
    throw new AppError(
      'Not enough exercises available for this combination of level, equipment, and injury constraints. Try broadening equipment options.',
      422,
      'INSUFFICIENT_CANDIDATES'
    );
  }

  const system = logic.buildSystemPrompt();
  const userPrompt = logic.buildUserPrompt(user, options, candidates);

  let raw;
  try {
    raw = await aiClient.generateJSON({ system, user: userPrompt });
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(`AI generation failed: ${err.message}`, 502, 'AI_GENERATION_FAILED');
  }

  let sanitized;
  try {
    sanitized = logic.validateAndSanitizePlan(raw, candidates);
  } catch (err) {
    throw new AppError(`AI returned an unusable plan: ${err.message}`, 502, 'AI_INVALID_PLAN');
  }

  const { plan, stats } = sanitized;

  const workoutPlan = await WorkoutPlan.create({
    ownerId: user._id,
    title: plan.title,
    goal: plan.goal,
    level: plan.level,
    generatedByAI: true,
    days: plan.days,
  });

  return { workoutPlan, stats };
}

module.exports = { generateWorkoutPlan, selectCandidateExercises };
