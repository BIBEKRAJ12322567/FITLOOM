const mongoose = require('mongoose');
const { Schema } = mongoose;

const gymReviewSchema = new Schema(
  {
    gymId: { type: Schema.Types.ObjectId, ref: 'Gym', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 1000 },
  },
  { timestamps: true }
);

// One review per user per gym — resubmitting updates the existing review
// rather than creating duplicates. Deliberately NOT run through
// tenantScopePlugin: reviews need to be readable across every gym (that's
// the entire point — comparing gyms), so isolation by gymId is enforced
// explicitly in reviewController, not by the shared plugin.
gymReviewSchema.index({ gymId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('GymReview', gymReviewSchema);