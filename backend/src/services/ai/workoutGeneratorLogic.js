const LEVEL_RANK = { beginner: 0, intermediate: 1, advanced: 2 };
const DEFAULT_MUSCLE_GROUPS = [
  'chest',
  'back',
  'legs',
  'shoulders',
  'biceps',
  'triceps',
  'core',
  'glutes',
];

function normalizeBodyPart(bodyPart) {
  return String(bodyPart).trim().toLowerCase().replace(/\s+/g, '_');
}

/**
 * Data convention this relies on: when seeding the Exercise collection,
 * injury risk/safety tags follow `${bodyPart}_risk` / `${bodyPart}_friendly`
 * (e.g. a user with a "knee" injury excludes exercises tagged 'knee_risk').
 * Enforce this convention at seed time or the filter silently does nothing.
 */
function injuryRiskTagsFor(injuries = []) {
  return injuries.map((i) => `${normalizeBodyPart(i.bodyPart)}_risk`);
}

/**
 * Builds the Mongoose filter for candidate exercises. Deliberately EXCLUDES
 * any exercise tagged risky for a user's injury regardless of severity
 * ('mild' included) — a conservative default appropriate for an
 * unsupervised AI generator. A future version could relax this for 'mild'
 * severity behind an explicit "I've cleared this with my physio" toggle,
 * but that's a product decision, not a default.
 */
function buildCandidateFilter(user, options = {}) {
  const userLevel = options.level || user.profile?.experienceLevel || 'beginner';
  const maxRank = LEVEL_RANK[userLevel] ?? 0;
  const allowedDifficulties = Object.keys(LEVEL_RANK).filter((d) => LEVEL_RANK[d] <= maxRank);

  const filter = { difficulty: { $in: allowedDifficulties } };

  const riskTags = injuryRiskTagsFor(user.profile?.injuries);
  if (riskTags.length) {
    filter.injuryRiskFor = { $nin: riskTags };
  }
  if (options.equipment?.length) {
    filter.equipment = { $in: options.equipment };
  }

  return filter;
}

function muscleGroupsToQuery(options = {}) {
  return options.muscleGroups?.length ? options.muscleGroups : DEFAULT_MUSCLE_GROUPS;
}

/**
 * Trims a raw candidate exercise document down to only what the AI prompt
 * needs — keeps token usage down and avoids leaking internal fields.
 */
function toPromptCandidate(exercise) {
  return {
    id: String(exercise._id),
    name: exercise.name,
    muscleGroups: exercise.muscleGroups,
    equipment: exercise.equipment,
    difficulty: exercise.difficulty,
  };
}

function buildSystemPrompt() {
  return [
    'You are a certified strength & conditioning coach designing a structured workout program.',
    'You MUST only use exercises from the candidate list provided — reference them by their exact "id" field.',
    'Never invent an exercise or an id that is not in the candidate list; if the list lacks something you need for a muscle group, work with what is available rather than inventing.',
    'Respond with ONLY a single JSON object, no prose, matching exactly this shape:',
    '{"title": string, "goal": string, "level": "beginner"|"intermediate"|"advanced", "days": [{"dayLabel": string, "exercises": [{"exerciseId": string, "sets": number, "repsTarget": string, "restSeconds": number}]}]}',
  ].join('\n');
}

function buildUserPrompt(user, options, candidates) {
  const level = options.level || user.profile?.experienceLevel || 'beginner';
  const goal = options.goal || user.profile?.goals?.[0] || 'general_fitness';
  const daysPerWeek = options.daysPerWeek || 3;
  const injuries = user.profile?.injuries || [];

  const lines = [
    `Design a ${daysPerWeek}-day-per-week workout plan.`,
    `Primary goal: ${goal}.`,
    `Experience level: ${level}.`,
    injuries.length
      ? `Known injuries (candidate list has already excluded exercises risky for these — still favor lighter loading and controlled tempo for these areas): ${injuries
          .map((i) => `${i.bodyPart} (${i.severity})`)
          .join(', ')}.`
      : 'No reported injuries.',
    options.notes ? `Additional notes from the user: ${options.notes}` : '',
    '',
    'Candidate exercises (choose only from this list, referencing by "id"):',
    JSON.stringify(candidates),
  ];

  return lines.filter(Boolean).join('\n');
}

/**
 * Validates the AI's raw JSON against the actual candidate set and drops
 * anything that doesn't check out — this is the safety net against
 * hallucinated exercise ids, not just the prompt instruction.
 *
 * Throws if the plan is unusable (no valid days at all); otherwise returns
 * a sanitized plan, logging how much was dropped so it's visible in ops.
 */
function validateAndSanitizePlan(raw, candidates) {
  const candidateIds = new Set(candidates.map((c) => c.id));

  if (!raw || !Array.isArray(raw.days)) {
    throw new Error('AI response missing a "days" array');
  }

  let totalExercises = 0;
  let droppedExercises = 0;

  const sanitizedDays = raw.days
    .map((day) => {
      const exercises = Array.isArray(day.exercises) ? day.exercises : [];
      const validExercises = exercises
        .map((ex) => {
          totalExercises += 1;
          if (!ex || !candidateIds.has(String(ex.exerciseId))) {
            droppedExercises += 1;
            return null;
          }
          const sets = Number(ex.sets);
          const restSeconds = Number(ex.restSeconds);
          if (!Number.isFinite(sets) || sets < 1) {
            droppedExercises += 1;
            return null;
          }
          return {
            exerciseId: String(ex.exerciseId),
            sets,
            repsTarget: String(ex.repsTarget || '8-12'),
            restSeconds: Number.isFinite(restSeconds) && restSeconds > 0 ? restSeconds : 60,
          };
        })
        .filter(Boolean);

      return {
        dayLabel: String(day.dayLabel || 'Training day'),
        exercises: validExercises,
      };
    })
    .filter((day) => day.exercises.length > 0);

  if (sanitizedDays.length === 0) {
    throw new Error(
      `AI response had no usable exercises after validation (${droppedExercises}/${totalExercises} dropped)`
    );
  }

  return {
    plan: {
      title: String(raw.title || 'AI-generated workout plan'),
      goal: String(raw.goal || 'general_fitness'),
      level: ['beginner', 'intermediate', 'advanced'].includes(raw.level) ? raw.level : 'beginner',
      days: sanitizedDays,
    },
    stats: { totalExercises, droppedExercises },
  };
}

module.exports = {
  LEVEL_RANK,
  DEFAULT_MUSCLE_GROUPS,
  normalizeBodyPart,
  injuryRiskTagsFor,
  buildCandidateFilter,
  muscleGroupsToQuery,
  toPromptCandidate,
  buildSystemPrompt,
  buildUserPrompt,
  validateAndSanitizePlan,
};
