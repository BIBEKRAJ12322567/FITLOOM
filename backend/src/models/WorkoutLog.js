const mongoose = require('mongoose');
const { Schema } = mongoose;

const setEntrySchema = new Schema(
  {
    reps: { type: Number, required: true, min: 0 },
    weightKg: { type: Number, required: true, min: 0 },
    rpe: { type: Number, min: 1, max: 10 }, // rate of perceived exertion, optional
  },
  { _id: false }
);

const logEntrySchema = new Schema(
  {
    exerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise', required: true },
    sets: { type: [setEntrySchema], required: true, validate: (v) => v.length > 0 },
  },
  { _id: false }
);

const workoutLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Optional — which gym they trained at, if any. NOT tenant-scoped (this
    // collection belongs to the user, not the gym), so no tenantScopePlugin here.
    gymId: { type: Schema.Types.ObjectId, ref: 'Gym', default: null },
    planId: { type: Schema.Types.ObjectId, ref: 'WorkoutPlan', default: null },
    date: { type: Date, required: true, index: true },
    entries: { type: [logEntrySchema], required: true, validate: (v) => v.length > 0 },
  },
  { timestamps: true }
);

// Primary access pattern: "give me this user's logs, most recent first" — powers
// progress graphs, streak calculation, and progressive-overload suggestions.
workoutLogSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('WorkoutLog', workoutLogSchema);
