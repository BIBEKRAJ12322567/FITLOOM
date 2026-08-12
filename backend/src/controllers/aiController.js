const workoutGeneratorService = require('../services/ai/workoutGeneratorService');

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

module.exports = { generateWorkout };
