const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    channel: { type: String, enum: ['email', 'sms', 'push', 'in_app'], required: true },
    type: {
      type: String,
      enum: ['membership_renewal', 'workout_reminder', 'booking_confirmed', 'order_update'],
      required: true,
    },
    payload: { type: Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ['queued', 'sent', 'failed'], default: 'queued', index: true },
    scheduledFor: { type: Date, index: true },
    sentAt: Date,
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
