const mongoose = require('mongoose');
const { Schema } = mongoose;
const tenantScopePlugin = require('../plugins/tenantScopePlugin');

const membershipSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    planId: { type: Schema.Types.ObjectId, ref: 'MembershipPlan', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true, index: true }, // scanned by the renewal-reminder job
    status: {
      type: String,
      // 'pending_payment' only exists while waiting on a real Razorpay
      // checkout to complete — the mock instant-capture path (no gateway
      // configured) never produces it, going straight to 'active' the
      // same way this always worked before.
      enum: ['pending_payment', 'active', 'expired', 'frozen', 'cancelled'],
      default: 'active',
      index: true,
    },
    autoRenew: { type: Boolean, default: false },
  },
  { timestamps: true }
);

membershipSchema.plugin(tenantScopePlugin);
membershipSchema.index({ gymId: 1, userId: 1 });

module.exports = mongoose.model('Membership', membershipSchema);