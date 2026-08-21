const mongoose = require('mongoose');
const { Schema } = mongoose;

const gymSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    address: {
      line1: String,
      city: String,
      state: String,
      pincode: String,
      geo: { lat: Number, lng: Number },
    },
    contactPhone: String,
    logoUrl: String,

    subscriptionPlan: {
      type: String,
      enum: ['trial', 'basic', 'pro', 'enterprise'],
      default: 'trial',
    },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'past_due', 'cancelled'],
      default: 'active',
      index: true,
    },
    subscriptionRenewsAt: Date,

    settings: {
      qrAttendanceEnabled: { type: Boolean, default: false },
      currency: { type: String, default: 'INR' },
    },

    facilities: [String], // e.g. ['Cardio zone', 'Free weights', 'Locker rooms', 'Steam room']
    description: String,

    // Denormalized rating, same pattern as TrainerProfile.ratingAvg —
    // recomputed by reviewController whenever a GymReview is created/updated,
    // rather than aggregated live on every gym-list request.
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },

    // Platform moderation flag — an admin can pull a gym from public
    // search/browsing and block new joins without deleting its data or
    // touching the owner's account. The owner dashboard still works while
    // suspended (they can see why and fix whatever triggered it).
    isSuspended: { type: Boolean, default: false },
  },
  { timestamps: true }
);

gymSchema.index({ 'address.city': 1 });
gymSchema.index({ ratingAvg: -1 });

module.exports = mongoose.model('Gym', gymSchema);