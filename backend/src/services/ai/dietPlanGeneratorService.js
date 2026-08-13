const { User, DietPlan } = require('../../models');
const AppError = require('../../utils/AppError');
const aiClient = require('./aiClient');
const logic = require('./dietPlanGeneratorLogic');
 
async function generateDietPlan(userId, options = {}) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }
 
  // weightKg/heightCm/age/sex can come from the request (the frontend form
  // collects these directly, same pattern as the profile-completion gap in
  // AI Coach) or fall back to the user's saved profile if present.
  const weightKg = options.weightKg ?? user.profile?.weightKg;
  const heightCm = options.heightCm ?? user.profile?.heightCm;
  const sex = options.sex ?? user.profile?.gender;
  const age =
    options.age ??
    (user.profile?.dob ? Math.floor((Date.now() - new Date(user.profile.dob)) / 31557600000) : undefined);
 
  if (!weightKg || !heightCm || !age || !sex) {
    throw new AppError(
      'Weight, height, age, and sex are required to calculate a calorie target — provide them in the request or complete your profile first.',
      422,
      'MISSING_PROFILE_DATA'
    );
  }
 
  const goal = options.goal || user.profile?.goals?.[0] || 'general_fitness';
  const activityLevel = options.activityLevel || 'moderate';
  const dietaryPreference = options.dietaryPreference || 'no_preference';
  const cuisinePreference = options.cuisinePreference || 'general';
 
  const { target: calorieTarget } = logic.calculateCalorieTarget({
    weightKg,
    heightCm,
    age,
    sex,
    activityLevel,
    goal,
  });
  const macros = logic.calculateMacros({ weightKg, target: calorieTarget, goal });
 
  const system = logic.buildSystemPrompt();
  const userPrompt = logic.buildUserPrompt({
    goal,
    calorieTarget,
    macros,
    dietaryPreference,
    cuisinePreference,
    notes: options.notes,
  });
 
  let raw;
  try {
    raw = await aiClient.generateJSON({ system, user: userPrompt });
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(`AI generation failed: ${err.message}`, 502, 'AI_GENERATION_FAILED');
  }
 
  let sanitized;
  try {
    sanitized = logic.validateAndSanitizePlan(raw, calorieTarget);
  } catch (err) {
    throw new AppError(`AI returned an unusable meal plan: ${err.message}`, 502, 'AI_INVALID_PLAN');
  }
 
  const { meals, title, stats } = sanitized;
 
  const dietPlan = await DietPlan.create({
    ownerId: user._id,
    title,
    goal,
    dailyCalorieTarget: calorieTarget,
    macros,
    meals,
    dietaryPreference,
    cuisinePreference,
    generatedByAI: true,
  });
 
  return { dietPlan, stats };
}
 
module.exports = { generateDietPlan };
 