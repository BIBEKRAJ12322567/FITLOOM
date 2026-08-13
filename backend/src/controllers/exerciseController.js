const { Exercise } = require('../models');
 
/**
 * GET /api/exercises?ids=id1,id2,id3
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
 
module.exports = { getExercisesByIds };
 