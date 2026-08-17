/**
 * Run with: node src/seed/seedExercises.js
 *
 * Populates a starter Exercise library across major muscle groups, at
 * beginner/intermediate difficulty, with injury tags following the
 * `${bodyPart}_risk` / `${bodyPart}_friendly` convention that
 * workoutGeneratorLogic.js relies on for injury-aware filtering.
 *
 * Without this, the AI workout generator has zero candidates to choose
 * from and every request fails with INSUFFICIENT_CANDIDATES — this script
 * is what unblocks that end-to-end.
 */
const mongoose = require('mongoose');
const config = require('../config/env');
const Exercise = require('../models/Exercise');

/**
 * Fetches real exercise thumbnails from wger.de — a free, open-source
 * fitness database (CC-BY-SA 4.0 licensed, public API, no auth required).
 * https://wger.de
 *
 * NOTE ON HOW THIS WAS ARRIVED AT — two earlier attempts failed, both
 * confirmed with real live API calls (not guesses):
 *   1. Base /api/v2/exercise/ list has no flat "name" field (names live on
 *      a separate translation object) — confirmed 0/20 match live.
 *   2. /api/v2/exercise/search/?term=... does not exist on the live API —
 *      confirmed via the real /api/v2/?format=json root listing, which has
 *      no "search" key, and a direct hit on that URL returned
 *      {"detail":"Not found."}.
 *   3. /api/v2/exercise-translation/?name__icontains=X&language=2 is a real
 *      endpoint, but the name filter is silently IGNORED by the live API —
 *      confirmed because the result count (3319) and returned rows were
 *      identical to the fully unfiltered call, and returned names had
 *      nothing to do with the search term.
 *
 * Working approach (server-side filtering is not usable at all): pull every
 * English (language=2) translation once via pagination, build an in-memory
 * name -> exercise-id index, then match all 20 local exercise names against
 * it client-side. language=2 as a query param DOES work (confirmed: every
 * row in a language=2 call had "language":2).
 */
async function loadWgerTranslationIndex() {
  const index = new Map(); // lowercased translation name -> exercise id
  let url = 'https://wger.de/api/v2/exercise-translation/?language=2&limit=200&format=json';
  let pagesFetched = 0;
  const MAX_PAGES = 25; // safety cap (~5000 rows) — real total is ~3319

  while (url && pagesFetched < MAX_PAGES) {
    const res = await fetch(url);
    if (!res.ok) break;
    const data = await res.json();

    for (const t of data.results || []) {
      if (t.name && t.exercise) {
        const key = t.name.toLowerCase().trim();
        if (!index.has(key)) index.set(key, t.exercise);
      }
    }

    url = data.next || null;
    pagesFetched += 1;
  }

  return index;
}

const STOPWORDS = new Set(['a', 'an', 'the', 'with', 'on', 'in', 'of', 'to', 'and']);

function tokenize(name) {
  return name
    .toLowerCase()
    .replace(/[()]/g, ' ')
    .split(/[\s\-_/]+/)
    .filter((w) => w.length > 0 && !STOPWORDS.has(w));
}

// naive singularizer — good enough to bridge "Squat" vs wger's "Squats"
function singularize(word) {
  if (word.endsWith('ies')) return word.slice(0, -3) + 'y';
  if (word.endsWith('es')) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

function findExerciseIdByName(index, exerciseName) {
  const target = exerciseName.toLowerCase().trim();

  // Tier 1: exact match
  if (index.has(target)) return index.get(target);

  const targetWords = tokenize(exerciseName);

  // Tier 2: strict word-overlap match — ALL of the local exercise's
  // significant words must appear in the candidate (singular/plural
  // tolerant), preferring the tightest (fewest extra words) candidate.
  // This catches cases like local "Squat" vs wger's "Squats", or word-order
  // differences, without risking false positives from partial overlap.
  if (targetWords.length > 0) {
    let bestId = null;
    let bestCandidateWordCount = Infinity;

    for (const [candidateName, exerciseId] of index) {
      const candidateWords = tokenize(candidateName);
      if (candidateWords.length === 0) continue;

      const allWordsPresent = targetWords.every((tw) => {
        if (candidateWords.includes(tw)) return true;
        const twSing = singularize(tw);
        return candidateWords.some((cw) => singularize(cw) === twSing);
      });

      if (allWordsPresent && candidateWords.length < bestCandidateWordCount) {
        bestId = exerciseId;
        bestCandidateWordCount = candidateWords.length;
      }
    }

    if (bestId !== null) return bestId;
  }

  // Tier 3: old substring fallback (kept as a safety net so anything that
  // matched before this change still matches now — never a regression).
  // Picks the longest/most specific matching candidate rather than the
  // first one encountered, so a partial match like "dip" doesn't win over
  // a closer one like "tricep dips" when neither is a perfect tier-2 match.
  let bestSubstringId = null;
  let bestSubstringLength = -1;
  for (const [candidateName, exerciseId] of index) {
    if (candidateName.includes(target) || target.includes(candidateName)) {
      if (candidateName.length > bestSubstringLength) {
        bestSubstringId = exerciseId;
        bestSubstringLength = candidateName.length;
      }
    }
  }
  return bestSubstringId;
}

async function fetchWgerImageForExerciseId(exerciseId) {
  try {
    const imgRes = await fetch(
      `https://wger.de/api/v2/exerciseimage/?exercise=${exerciseId}&is_main=True&format=json`
    );
    if (!imgRes.ok) return null;
    const imgData = await imgRes.json();

    const image = imgData.results?.[0];
    return image?.thumbnails?.medium || image?.image || null;
  } catch (err) {
    return null;
  }
}

const exercises = [
  {
    name: 'Bodyweight Squat',
    muscleGroups: ['legs', 'glutes'],
    equipment: 'none',
    difficulty: 'beginner',
    instructions: ['Stand feet shoulder-width apart', 'Lower hips back and down', 'Drive through heels to stand'],
    injurySafeFor: ['knee_friendly'],
    injuryRiskFor: [],
  },
  {
    name: 'Goblet Squat',
    muscleGroups: ['legs', 'glutes'],
    equipment: 'dumbbell',
    difficulty: 'beginner',
    instructions: ['Hold a dumbbell at chest height', 'Squat down keeping chest up', 'Drive up through heels'],
    injurySafeFor: ['knee_friendly'],
    injuryRiskFor: [],
  },
  {
    name: 'Barbell Back Squat',
    muscleGroups: ['legs', 'glutes'],
    equipment: 'barbell',
    difficulty: 'advanced',
    instructions: ['Bar on upper back', 'Squat to depth', 'Drive up explosively'],
    injurySafeFor: [],
    injuryRiskFor: ['knee_risk'],
  },
  {
    name: 'Glute Bridge',
    muscleGroups: ['glutes', 'hamstrings'],
    equipment: 'none',
    difficulty: 'beginner',
    instructions: ['Lie on back, knees bent', 'Drive hips upward squeezing glutes', 'Lower with control'],
    injurySafeFor: ['knee_friendly', 'lower_back_friendly'],
    injuryRiskFor: [],
  },
  {
    name: 'Push-up',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    equipment: 'none',
    difficulty: 'beginner',
    instructions: ['Plank position, hands under shoulders', 'Lower chest to floor', 'Push back up'],
    injurySafeFor: [],
    injuryRiskFor: ['shoulder_risk'],
  },
  {
    name: 'Incline Dumbbell Press',
    muscleGroups: ['chest', 'shoulders'],
    equipment: 'dumbbell',
    difficulty: 'intermediate',
    instructions: ['Set bench to incline', 'Press dumbbells up from chest', 'Lower under control'],
    injurySafeFor: ['shoulder_friendly'],
    injuryRiskFor: [],
  },
  {
    name: 'Barbell Bench Press',
    muscleGroups: ['chest', 'triceps'],
    equipment: 'barbell',
    difficulty: 'intermediate',
    instructions: ['Lie on bench, grip slightly wider than shoulders', 'Lower bar to chest', 'Press up'],
    injurySafeFor: [],
    injuryRiskFor: ['shoulder_risk'],
  },
  {
    name: 'Resistance Band Row',
    muscleGroups: ['back', 'biceps'],
    equipment: 'resistance_band',
    difficulty: 'beginner',
    instructions: ['Anchor band at chest height', 'Pull elbows back squeezing shoulder blades', 'Return with control'],
    injurySafeFor: ['shoulder_friendly'],
    injuryRiskFor: [],
  },
  {
    name: 'Lat Pulldown',
    muscleGroups: ['back', 'biceps'],
    equipment: 'machine',
    difficulty: 'beginner',
    instructions: ['Grip bar wide', 'Pull down to upper chest', 'Control the return'],
    injurySafeFor: ['shoulder_friendly'],
    injuryRiskFor: [],
  },
  {
    name: 'Bent-over Barbell Row',
    muscleGroups: ['back', 'biceps'],
    equipment: 'barbell',
    difficulty: 'intermediate',
    instructions: ['Hinge at hips, flat back', 'Pull bar to lower ribs', 'Lower with control'],
    injurySafeFor: [],
    injuryRiskFor: ['lower_back_risk'],
  },
  {
    name: 'Dumbbell Shoulder Press',
    muscleGroups: ['shoulders', 'triceps'],
    equipment: 'dumbbell',
    difficulty: 'beginner',
    instructions: ['Press dumbbells overhead', 'Lower to ear height', 'Repeat with control'],
    injurySafeFor: [],
    injuryRiskFor: ['shoulder_risk'],
  },
  {
    name: 'Dumbbell Bicep Curl',
    muscleGroups: ['biceps'],
    equipment: 'dumbbell',
    difficulty: 'beginner',
    instructions: ['Curl dumbbells to shoulders', 'Squeeze at the top', 'Lower slowly'],
    injurySafeFor: [],
    injuryRiskFor: [],
  },
  {
    name: 'Tricep Dip (bench)',
    muscleGroups: ['triceps', 'chest'],
    equipment: 'none',
    difficulty: 'beginner',
    instructions: ['Hands on bench behind you', 'Lower body bending elbows', 'Press back up'],
    injurySafeFor: [],
    injuryRiskFor: ['shoulder_risk'],
  },
  {
    name: 'Plank',
    muscleGroups: ['core'],
    equipment: 'none',
    difficulty: 'beginner',
    instructions: ['Forearms and toes on floor', 'Keep body in a straight line', 'Hold, breathing steadily'],
    injurySafeFor: ['lower_back_friendly'],
    injuryRiskFor: [],
  },
  {
    name: 'Dead Bug',
    muscleGroups: ['core'],
    equipment: 'none',
    difficulty: 'beginner',
    instructions: ['Lie on back, arms and knees up', 'Extend opposite arm and leg', 'Return and alternate'],
    injurySafeFor: ['lower_back_friendly'],
    injuryRiskFor: [],
  },
  {
    name: 'Romanian Deadlift',
    muscleGroups: ['hamstrings', 'glutes'],
    equipment: 'barbell',
    difficulty: 'intermediate',
    instructions: ['Hinge at hips, slight knee bend', 'Lower bar along legs', 'Drive hips forward to stand'],
    injurySafeFor: [],
    injuryRiskFor: ['lower_back_risk'],
  },
  {
    name: 'Bodyweight Lunge',
    muscleGroups: ['legs', 'glutes'],
    equipment: 'none',
    difficulty: 'beginner',
    instructions: ['Step forward into a lunge', 'Lower back knee toward floor', 'Push back to start'],
    injurySafeFor: ['knee_friendly'],
    injuryRiskFor: [],
  },
  {
    name: 'Calf Raise',
    muscleGroups: ['calves'],
    equipment: 'none',
    difficulty: 'beginner',
    instructions: ['Rise onto toes', 'Pause at the top', 'Lower with control'],
    injurySafeFor: [],
    injuryRiskFor: [],
  },
  {
    name: 'Face Pull',
    muscleGroups: ['shoulders', 'back'],
    equipment: 'resistance_band',
    difficulty: 'beginner',
    instructions: ['Pull band toward face, elbows high', 'Squeeze shoulder blades', 'Return with control'],
    injurySafeFor: ['shoulder_friendly'],
    injuryRiskFor: [],
  },
  {
    name: 'Mountain Climbers',
    muscleGroups: ['core', 'shoulders'],
    equipment: 'none',
    difficulty: 'beginner',
    instructions: ['Plank position', 'Drive knees toward chest alternately', 'Keep hips level'],
    injurySafeFor: [],
    injuryRiskFor: ['shoulder_risk'],
  },
];

async function seed() {
  await mongoose.connect(config.mongodbUri);
  console.log('Connected to MongoDB for seeding.');

  const existingCount = await Exercise.countDocuments();
  if (existingCount > 0) {
    console.log(`Exercise collection already has ${existingCount} documents. Skipping seed.`);
    console.log('Delete the collection first if you want to reseed from scratch (with images).');
    await mongoose.disconnect();
    return;
  }

  console.log('Building wger.de exercise name index (paginating English translations)...');
  let wgerIndex = new Map();
  try {
    wgerIndex = await loadWgerTranslationIndex();
    console.log(`  Indexed ${wgerIndex.size} unique exercise names from wger.de.`);
  } catch (err) {
    console.warn(`  wger.de index build failed (${err.message}) — continuing with icon placeholders for all exercises.`);
  }

  console.log('Matching local exercises against the index and fetching images...');
  let matchedCount = 0;
  for (const exercise of exercises) {
    const exerciseId = findExerciseIdByName(wgerIndex, exercise.name);
    const thumbnailUrl = exerciseId ? await fetchWgerImageForExerciseId(exerciseId) : null;
    if (thumbnailUrl) {
      exercise.thumbnailUrl = thumbnailUrl;
      matchedCount += 1;
      console.log(`  ✓ ${exercise.name} — found image`);
    } else if (exerciseId) {
      console.log(`  – ${exercise.name} — matched exercise #${exerciseId} but it has no image, will use icon placeholder`);
    } else {
      console.log(`  – ${exercise.name} — no name match, will use icon placeholder`);
    }
  }
  console.log(`Matched ${matchedCount}/${exercises.length} exercises with a real thumbnail from wger.de.`);
  console.log('Images via wger.de, licensed CC-BY-SA 4.0 (https://wger.de).');

  const inserted = await Exercise.insertMany(exercises);
  console.log(`Seeded ${inserted.length} exercises.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});