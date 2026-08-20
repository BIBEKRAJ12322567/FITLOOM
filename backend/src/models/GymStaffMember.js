const mongoose = require('mongoose');
const { Schema } = mongoose;
const tenantScopePlugin = require('../plugins/tenantScopePlugin');

// Keep in sync with frontend/src/api/gymApi.js's STAFF_PERMISSIONS list.
const STAFF_PERMISSIONS = [
  'view_overview',
  'manage_members',
  'manage_plans',
  'manage_products',
  'manage_attendance',
];

const gymStaffMemberSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // What this staffer is allowed to do on the owner dashboard for this
    // gym — checked by requireGymPermission. An owner always has full
    // access regardless of this list; this only governs delegated staff.
    permissions: {
      type: [String],
      enum: STAFF_PERMISSIONS,
      default: [],
    },
    // 'revoked' rather than deleting the row — keeps an audit trail of who
    // had access to what, and lets requireGymPermission lock a revoked
    // staffer out immediately without waiting for their token to expire.
    status: { type: String, enum: ['active', 'revoked'], default: 'active', index: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

gymStaffMemberSchema.plugin(tenantScopePlugin);
gymStaffMemberSchema.index({ gymId: 1, userId: 1 }, { unique: true });

gymStaffMemberSchema.statics.STAFF_PERMISSIONS = STAFF_PERMISSIONS;

module.exports = mongoose.model('GymStaffMember', gymStaffMemberSchema);