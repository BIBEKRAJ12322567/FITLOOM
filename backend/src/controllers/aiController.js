const workoutGeneratorService = require('../services/ai/workoutGeneratorService');
const dietPlanGeneratorService = require('../services/ai/dietPlanGeneratorService');
 
async function generateWorkout(req, res, next) {
  try {
    const { daysPerWeek, goal, level, equipment, muscleGroups, notes } = req.body;
    const { workoutPlan, stats } = await workoutGeneratorService.generateWorkoutPlan(req.user.id, {
      daysPerWeek,
      goal,
      level,
      equipment,
      muscleGroups,
      notes,
    });
 
    res.status(201).json({
      workoutPlan,
      // Surfacing this lets the client show "we simplified your plan
      // slightly" messaging if the AI proposed exercises that got filtered.
      meta: { droppedExercises: stats.droppedExercises, totalExercisesConsidered: stats.totalExercises },
    });
  } catch (err) {
    next(err);
  }
}
 
async function generateDietPlan(req, res, next) {
  try {
    const { weightKg, heightCm, age, sex, activityLevel, goal, dietaryPreference, cuisinePreference, notes } =
      req.body;
    const { dietPlan, stats } = await dietPlanGeneratorService.generateDietPlan(req.user.id, {
      weightKg,
      heightCm,
      age,
      sex,
      activityLevel,
      goal,
      dietaryPreference,
      cuisinePreference,
      notes,
    });
 
    res.status(201).json({
      dietPlan,
      // Lets the client show a "meals landed X% off your target" note if
      // the AI's food choices deviated meaningfully from the fixed
      // calorie target it was given.
      meta: {
        droppedItems: stats.droppedItems,
        deviationPct: stats.deviationPct,
        totalCalories: stats.totalCalories,
      },
    });
  } catch (err) {
    next(err);
  }
}
 
module.exports = { generateWorkout, generateDietPlan };
 