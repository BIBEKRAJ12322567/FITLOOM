const mongoose = require('mongoose');
const { Schema } = mongoose;
 
const mealItemSchema = new Schema(
  {
    name: { type: String, required: true },
    portion: { type: String, required: true }, // e.g. "150g", "1 cup", "2 rotis"
    calories: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);
 
const mealSchema = new Schema(
  {
    mealLabel: { type: String, required: true }, // e.g. "Breakfast"
    items: { type: [mealItemSchema], required: true, validate: (v) => v.length > 0 },
  },
  { _id: false }
);
 
const dietPlanSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    goal: {
      type: String,
      enum: ['weight_loss', 'muscle_gain', 'general_fitness', 'strength', 'endurance'],
      required: true,
    },
    // Computed deterministically server-side (Mifflin-St Jeor), not by the AI —
    // see dietPlanGeneratorLogic.js. Stored here so the plan is self-contained
    // and doesn't drift if the user's stats change later.
    dailyCalorieTarget: { type: Number, required: true, min: 0 },
    macros: {
      proteinG: { type: Number, required: true, min: 0 },
      carbsG: { type: Number, required: true, min: 0 },
      fatG: { type: Number, required: true, min: 0 },
    },
    meals: { type: [mealSchema], required: true, validate: (v) => v.length > 0 },
    dietaryPreference: {
      type: String,
      enum: ['no_preference', 'vegetarian', 'vegan', 'non_vegetarian'],
      default: 'no_preference',
    },
    cuisinePreference: { type: String, default: 'general' }, // e.g. 'indian', 'general'
    generatedByAI: { type: Boolean, default: false },
  },
  { timestamps: true }
);
 
dietPlanSchema.index({ ownerId: 1, createdAt: -1 });
 
module.exports = mongoose.model('DietPlan', dietPlanSchema);
