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
  },
  { timestamps: true }
);

module.exports = mongoose.model('Gym', gymSchema);
