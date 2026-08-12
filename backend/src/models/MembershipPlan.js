const mongoose = require('mongoose');
const { Schema } = mongoose;
const tenantScopePlugin = require('../plugins/tenantScopePlugin');

const membershipPlanSchema = new Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "3-month Gold"
    durationDays: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    features: [String],
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

membershipPlanSchema.plugin(tenantScopePlugin);
membershipPlanSchema.index({ gymId: 1, isActive: 1 });

module.exports = mongoose.model('MembershipPlan', membershipPlanSchema);
