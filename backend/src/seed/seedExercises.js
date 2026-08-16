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
 * Fetches a real exercise thumbnail from wger.de — a free, open-source
 * fitness database (CC-BY-SA 4.0 licensed, public API, no auth required).
 * https://wger.de
 *
 * IMPORTANT: this call was written against wger's documented API shape but
 * has NOT been tested against the live API (this project's sandbox can't
 * reach wger.de). It's defensively coded — any failure (network, unexpected
 * response shape, no match found) falls back to `null` and the seed
 * continues normally with the icon placeholder, it never crashes the seed.
 * Watch the console output when you run this — it'll tell you exactly
 * which exercises got a real image and which didn't.
 */
async function fetchWgerThumbnail(exerciseName) {
  try {
    // wger's base exercise list, English only, first 200 results — enough
    // to cover common compound/isolation lifts. Client-side name matching
    // avoids depending on wger's search-endpoint response shape, which
    // isn't fully documented publicly.
    const listRes = await fetch('https://wger.de/api/v2/exercise/?language=2&limit=200&format=json');
    if (!listRes.ok) return null;
    const listData = await listRes.json();

    const nameLower = exerciseName.toLowerCase();
    const match = listData.results?.find(
      (ex) => ex.name && (ex.name.toLowerCase().includes(nameLower) || nameLower.includes(ex.name.toLowerCase()))
    );
    if (!match) return null;

    const exerciseId = match.id || match.base_id || match.exercise_base;
    if (!exerciseId) return null;

    const imgRes = await fetch(`https://wger.de/api/v2/exerciseimage/?exercise=${exerciseId}&is_main=True&format=json`);
    if (!imgRes.ok) return null;
    const imgData = await imgRes.json();

    const image = imgData.results?.[0];
    return image?.thumbnails?.medium || image?.image || null;
  } catch (err) {
    console.warn(`  (wger lookup failed for "${exerciseName}": ${err.message})`);
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

  console.log('Looking up real thumbnails from wger.de for each exercise (this may take a minute)...');
  let matchedCount = 0;
  for (const exercise of exercises) {
    const thumbnailUrl = await fetchWgerThumbnail(exercise.name);
    if (thumbnailUrl) {
      exercise.thumbnailUrl = thumbnailUrl;
      matchedCount += 1;
      console.log(`  ✓ ${exercise.name} — found image`);
    } else {
      console.log(`  – ${exercise.name} — no match, will use icon placeholder`);
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