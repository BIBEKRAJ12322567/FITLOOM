const mongoose = require('mongoose');
const { Schema } = mongoose;
const tenantScopePlugin = require('../plugins/tenantScopePlugin');

const attendanceSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    checkInAt: { type: Date, required: true },
    checkOutAt: Date,
    method: { type: String, enum: ['qr', 'manual', 'app'], default: 'app' },
  },
  { timestamps: true }
);

attendanceSchema.plugin(tenantScopePlugin);
attendanceSchema.index({ gymId: 1, userId: 1, checkInAt: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
