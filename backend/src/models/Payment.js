const mongoose = require('mongoose');
const { Schema } = mongoose;

const paymentSchema = new Schema(
  {
    payerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Optional — set when the payment relates to a specific gym (membership,
    // gym subscription, order). NOT run through tenantScopePlugin: payments are
    // owned by the payer, and admin/finance views need to query across gyms.
    gymId: { type: Schema.Types.ObjectId, ref: 'Gym', default: null },
    purpose: {
      type: String,
      enum: ['user_subscription', 'gym_subscription', 'membership', 'order', 'trainer_booking'],
      required: true,
      index: true,
    },
    // Polymorphic: resolved in the service layer based on `purpose`
    // (Membership._id / Order._id / TrainerBooking._id / etc).
    // Deliberately not a typed ref so a single field covers every payment type —
    // trade-off is you can't .populate() this directly, resolve it in code.
    relatedEntityId: { type: Schema.Types.ObjectId, default: null },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    provider: { type: String, enum: ['razorpay', 'stripe'], required: true },
    providerPaymentId: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ['created', 'authorized', 'captured', 'failed', 'refunded'],
      default: 'created',
      index: true,
    },
    // Small bag of purpose-specific context needed to finalize the related
    // entity once payment is confirmed — e.g. { action: 'join' | 'renew' }
    // for membership payments, so the verify step knows whether to
    // activate a fresh membership or extend an existing one. Deliberately
    // Mixed/loose rather than a typed field per purpose, since this is
    // internal bookkeeping the API never exposes directly.
    metadata: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

paymentSchema.index({ payerUserId: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);