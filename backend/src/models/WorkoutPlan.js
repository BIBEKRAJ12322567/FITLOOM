const mongoose = require('mongoose');
const { Schema } = mongoose;

const planExerciseSchema = new Schema(
  {
    exerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise', required: true },
    sets: { type: Number, required: true, min: 1 },
    repsTarget: { type: String, required: true }, // e.g. "8-12"
    restSeconds: { type: Number, default: 60 },
  },
  { _id: false }
);

const planDaySchema = new Schema(
  {
    dayLabel: { type: String, required: true }, // e.g. "Day 1 - Push"
    exercises: [planExerciseSchema],
  },
  { _id: false }
);

const workoutPlanSchema = new Schema(
  {
    // null = system/AI-generated template not owned by a specific user
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    title: { type: String, required: true, trim: true },
    goal: { type: String, required: true },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    generatedByAI: { type: Boolean, default: false },
    days: { type: [planDaySchema], required: true, validate: (v) => v.length > 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WorkoutPlan', workoutPlanSchema);
