const mongoose = require('mongoose');
const { Schema } = mongoose;

const availabilitySlotSchema = new Schema(
  {
    dayOfWeek: { type: Number, min: 0, max: 6, required: true }, // 0 = Sunday
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true }, // "10:00"
  },
  { _id: false }
);

const trainerProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    bio: String,
    specializations: { type: [String], index: true },
    hourlyRate: { type: Number, required: true, min: 0 },
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    availability: [availabilitySlotSchema],
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

trainerProfileSchema.index({ ratingAvg: -1 });

module.exports = mongoose.model('TrainerProfile', trainerProfileSchema);
