const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};
 
/**
 * Same Mifflin-St Jeor equation as the frontend CalorieCalculator — computed
 * here too (server-side) so the AI is never trusted to do this arithmetic
 * itself. LLMs are unreliable at precise math; a wrong calorie target
 * silently baked into a "plan" is a worse failure than an obviously-wrong
 * exercise, so this is computed deterministically and handed to the AI as
 * a fixed constraint, not a suggestion.
 */
function calculateCalorieTarget({ weightKg, heightCm, age, sex, activityLevel, goal }) {
  const bmr =
    sex === 'female'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age - 161
      : 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
 
  const tdee = bmr * (ACTIVITY_MULTIPLIERS[activityLevel] || ACTIVITY_MULTIPLIERS.moderate);
 
  let target = tdee;
  if (goal === 'weight_loss') target = tdee - 500;
  if (goal === 'muscle_gain') target = tdee + 300;
 
  return { bmr: Math.round(bmr), tdee: Math.round(tdee), target: Math.round(target) };
}
 
/**
 * Macro split is also computed deterministically, not left to the AI:
 * protein is set relative to bodyweight (higher for muscle_gain, since
 * that's where protein synthesis demand is highest), fat as a percentage
 * of total calories, and carbs fill the remainder. These are standard
 * evidence-based ranges, not arbitrary.
 */
function calculateMacros({ weightKg, target, goal }) {
  const proteinPerKg = goal === 'muscle_gain' ? 2.0 : goal === 'weight_loss' ? 1.8 : 1.6;
  const proteinG = Math.round(weightKg * proteinPerKg);
  const proteinCalories = proteinG * 4;
 
  const fatCalories = target * 0.25;
  const fatG = Math.round(fatCalories / 9);
 
  const remainingCalories = Math.max(target - proteinCalories - fatCalories, 0);
  const carbsG = Math.round(remainingCalories / 4);
 
  return { proteinG, carbsG, fatG };
}
 
function buildSystemPrompt() {
  return [
    'You are a registered-dietitian-style nutrition planner designing a single day of meals.',
    'You are given a FIXED daily calorie target and FIXED macro targets (protein/carbs/fat in grams) — you MUST NOT change these numbers. Your job is only to design realistic meals and food items whose combined calories add up close to the given target (within about 10%).',
    'Respect the given dietary preference (vegetarian/vegan/non-vegetarian) and cuisine preference strictly — never include a food that violates the dietary preference.',
    'Respond with ONLY a single JSON object, no prose, matching exactly this shape:',
    '{"title": string, "meals": [{"mealLabel": string, "items": [{"name": string, "portion": string, "calories": number}]}]}',
  ].join('\n');
}
 
function buildUserPrompt({ goal, calorieTarget, macros, dietaryPreference, cuisinePreference, notes }) {
  const lines = [
    `Daily calorie target (fixed, do not change): ${calorieTarget} kcal.`,
    `Macro targets (fixed, do not change): ${macros.proteinG}g protein, ${macros.carbsG}g carbs, ${macros.fatG}g fat.`,
    `Goal: ${goal.replace('_', ' ')}.`,
    `Dietary preference: ${dietaryPreference.replace('_', ' ')}.`,
    `Cuisine preference: ${cuisinePreference}.`,
    notes ? `Additional notes from the user: ${notes}` : '',
    'Design 4-5 meals/snacks across the day that fit within these targets.',
  ];
  return lines.filter(Boolean).join('\n');
}
 
/**
 * Validates and sanitizes the AI's meal response. Unlike the workout
 * generator, there's no external "candidate set" to check food items
 * against (food isn't a safety-scoped resource the way exercises are), so
 * this focuses on structural validity and coercing types — plus flagging
 * (not rejecting) if the AI's meals landed far outside the fixed calorie
 * target, so the caller can decide whether that's acceptable.
 */
function validateAndSanitizePlan(raw, calorieTarget) {
  if (!raw || !Array.isArray(raw.meals) || raw.meals.length === 0) {
    throw new Error('AI response missing a usable "meals" array');
  }
 
  let totalCalories = 0;
  let droppedItems = 0;
 
  const sanitizedMeals = raw.meals
    .map((meal) => {
      const items = Array.isArray(meal.items) ? meal.items : [];
      const validItems = items
        .map((item) => {
          const calories = Number(item?.calories);
          if (!item?.name || !Number.isFinite(calories) || calories < 0) {
            droppedItems += 1;
            return null;
          }
          totalCalories += calories;
          return {
            name: String(item.name),
            portion: String(item.portion || 'serving'),
            calories,
          };
        })
        .filter(Boolean);
 
      return { mealLabel: String(meal.mealLabel || 'Meal'), items: validItems };
    })
    .filter((meal) => meal.items.length > 0);
 
  if (sanitizedMeals.length === 0) {
    throw new Error('AI response had no usable meal items after validation');
  }
 
  const deviationPct = calorieTarget > 0 ? Math.abs(totalCalories - calorieTarget) / calorieTarget : 0;
 
  return {
    meals: sanitizedMeals,
    title: String(raw.title || 'AI-generated meal plan'),
    stats: {
      droppedItems,
      totalCalories,
      calorieTarget,
      deviationPct: Math.round(deviationPct * 100),
    },
  };
}
 
module.exports = {
  calculateCalorieTarget,
  calculateMacros,
  buildSystemPrompt,
  buildUserPrompt,
  validateAndSanitizePlan,
};
 