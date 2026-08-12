const mongoose = require('mongoose');
const { Schema } = mongoose;

const exerciseSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    muscleGroups: { type: [String], index: true }, // ['quadriceps', 'glutes']
    equipment: String,
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    videoUrl: String, // Cloudinary
    thumbnailUrl: String,
    instructions: [String],
    // Used by the injury-aware AI/filtering logic — see AIService.
    injurySafeFor: { type: [String], index: true }, // e.g. ['knee_friendly']
    injuryRiskFor: [String], // e.g. ['knee_risk']
  },
  { timestamps: true }
);

module.exports = mongoose.model('Exercise', exerciseSchema);
