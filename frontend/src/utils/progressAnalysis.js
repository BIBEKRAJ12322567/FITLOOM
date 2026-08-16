/**
 * Sums reps × weight across every set in every entry for a log — a simple,
 * standard proxy for "how much work did this session actually involve"
 * (heavier weight or more reps both increase it), used as the Progress
 * chart's y-axis.
 */
function computeSessionVolume(log) {
  return log.entries.reduce((total, entry) => {
    const entryVolume = entry.sets.reduce((sum, set) => sum + set.reps * set.weightKg, 0);
    return total + entryVolume;
  }, 0);
}

/**
 * Returns chart-ready data: one point per log, oldest first (logs arrive
 * newest-first from the API), with date formatted for a compact x-axis.
 */
export function computeDailyVolumeSeries(logs) {
  return [...logs]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((log) => ({
      date: new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      volume: Math.round(computeSessionVolume(log)),
    }));
}

/**
 * Progressive overload suggestions: for each exercise, looks at the most
 * recent two sessions where it was logged. If the top set (highest reps at
 * the working weight) hit 12+ reps in BOTH of the last two sessions, that's
 * the classic signal it's time to add weight — the exercise has stopped
 * being challenging at the current load. This is intentionally a simple,
 * explainable heuristic rather than a black-box model: it only ever
 * triggers on a concrete, checkable pattern in the actual logged data.
 */
export function computeOverloadSuggestions(logs, exercisesById) {
  // Group all (date, topSetReps, topSetWeight) observations per exercise.
  const byExercise = {};

  for (const log of logs) {
    for (const entry of log.entries) {
      if (!entry.sets.length) continue;
      const topSet = entry.sets.reduce((max, s) => (s.reps > max.reps ? s : max), entry.sets[0]);
      if (!byExercise[entry.exerciseId]) byExercise[entry.exerciseId] = [];
      byExercise[entry.exerciseId].push({ date: log.date, reps: topSet.reps, weightKg: topSet.weightKg });
    }
  }

  const suggestions = [];

  for (const [exerciseId, observations] of Object.entries(byExercise)) {
    const sorted = [...observations].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (sorted.length < 2) continue;

    const [mostRecent, secondMostRecent] = sorted;
    const bothHitTopOfRange = mostRecent.reps >= 12 && secondMostRecent.reps >= 12;

    if (bothHitTopOfRange) {
      const name = exercisesById[exerciseId]?.name || 'This exercise';
      suggestions.push({
        exerciseId,
        message: `${name}: hit ${mostRecent.reps}+ reps two sessions in a row at ${mostRecent.weightKg}kg — try adding weight next time.`,
      });
    }
  }

  return suggestions;
}