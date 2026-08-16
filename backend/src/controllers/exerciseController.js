const { Exercise } = require('../models');

/**
 * GET /api/exercises?search=&muscleGroup=&difficulty=&equipment=&page=&limit=
 *
 * Public library browsing — the actual Exercise Library page. Distinct
 * from getExercisesByIds below (that one resolves a specific batch of ids
 * for a workout plan; this one is open-ended search/filter/paginate).
 */
async function listExercises(req, res, next) {
  try {
    const { search, muscleGroup, difficulty, equipment, page = 1, limit = 24 } = req.query;

    const filter = {};
    if (search) filter.name = new RegExp(search, 'i');
    if (muscleGroup) filter.muscleGroups = muscleGroup;
    if (difficulty) filter.difficulty = difficulty;
    if (equipment) filter.equipment = equipment;

    const skip = (Number(page) - 1) * Number(limit);
    const [exercises, total] = await Promise.all([
      Exercise.find(filter).sort({ name: 1 }).skip(skip).limit(Number(limit)).lean(),
      Exercise.countDocuments(filter),
    ]);

    res.status(200).json({ exercises, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (err) {
    next(err);
  }
}

/** GET /api/exercises/:id — single exercise detail page. */
async function getExerciseById(req, res, next) {
  try {
    const exercise = await Exercise.findById(req.params.id).lean();
    if (!exercise) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Exercise not found' } });
    }
    res.status(200).json({ exercise });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/exercises/batch?ids=id1,id2,id3
 *
 * Built specifically to unblock the AI Coach UI: a generated WorkoutPlan
 * only stores exerciseId references, not names, so the frontend needs a
 * way to resolve a batch of ids into display data in one round trip
 * instead of N individual lookups.
 */
async function getExercisesByIds(req, res, next) {
  try {
    const idsParam = req.query.ids;
    if (!idsParam) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Query param "ids" is required (comma-separated).' },
      });
    }

    const ids = idsParam
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (ids.length === 0) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'No valid ids provided.' },
      });
    }
    if (ids.length > 100) {
      // Generous ceiling — a single workout plan will never need more than a
      // couple dozen, this just guards against an accidental huge query.
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Too many ids requested (max 100).' },
      });
    }

    // Invalid ObjectId strings would otherwise throw a CastError — filter
    // them out up front so one bad id doesn't fail the whole batch.
    const validIds = ids.filter((id) => /^[a-f0-9]{24}$/i.test(id));

    const exercises = await Exercise.find({ _id: { $in: validIds } })
      .select('_id name muscleGroups equipment difficulty videoUrl thumbnailUrl')
      .lean();

    // Return as a map keyed by id — the frontend is resolving ids out of
    // WorkoutPlan.days[].exercises[].exerciseId, so an object lookup is a
    // more convenient shape to consume than re-searching an array each time.
    const byId = {};
    exercises.forEach((ex) => {
      byId[String(ex._id)] = ex;
    });

    res.status(200).json({ exercises: byId });
  } catch (err) {
    next(err);
  }
}

module.exports = { listExercises, getExerciseById, getExercisesByIds };