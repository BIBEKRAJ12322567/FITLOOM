const mongoose = require('mongoose');
const { Schema } = mongoose;

const trainerBookingSchema = new Schema(
  {
    trainerId: { type: Schema.Types.ObjectId, ref: 'TrainerProfile', required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Optional — null means an independent booking not made through a gym.
    // NOT run through tenantScopePlugin: a booking is fundamentally owned by the
    // trainer/client relationship, not a single gym's data boundary.
    gymId: { type: Schema.Types.ObjectId, ref: 'Gym', default: null },
    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, required: true, default: 60 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    sessionMode: { type: String, enum: ['video', 'in_person'], required: true },
    videoRoomId: String, // WebRTC/Socket.IO room reference, set when sessionMode = 'video'
    price: { type: Number, required: true, min: 0 },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', default: null },
  },
  { timestamps: true }
);

trainerBookingSchema.index({ trainerId: 1, scheduledAt: 1 });
trainerBookingSchema.index({ clientId: 1, scheduledAt: -1 });

module.exports = mongoose.model('TrainerBooking', trainerBookingSchema);
