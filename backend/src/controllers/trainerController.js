const crypto = require('crypto');
const { TrainerProfile, TrainerBooking } = require('../models');
const AppError = require('../utils/AppError');
const { recordMockPayment } = require('../services/paymentService');
const { isWithinAvailability, bookingsOverlap, computeSessionPrice } = require('../services/trainerService');

/** GET /api/trainers — public browse/search list, optionally filtered by specialization. */
async function listTrainers(req, res, next) {
  try {
    const filter = {};
    if (req.query.specialization) {
      // Mongoose/Mongo matches array fields against a scalar automatically —
      // this finds any profile whose specializations array contains the value.
      filter.specializations = req.query.specialization;
    }
    const trainers = await TrainerProfile.find(filter)
      .sort({ ratingAvg: -1 })
      .populate('userId', 'profile.name profile.avatarUrl')
      .lean();
    res.status(200).json({ trainers });
  } catch (err) {
    next(err);
  }
}

/** GET /api/trainers/:trainerId — public detail, includes availability for booking. */
async function getTrainerById(req, res, next) {
  try {
    const trainer = await TrainerProfile.findById(req.params.trainerId)
      .populate('userId', 'profile.name profile.avatarUrl')
      .lean();
    if (!trainer) {
      return next(new AppError('Trainer not found', 404, 'NOT_FOUND'));
    }
    res.status(200).json({ trainer });
  } catch (err) {
    next(err);
  }
}

/** GET /api/trainers/profile/me — the logged-in trainer's own profile. */
async function getMyProfile(req, res, next) {
  try {
    const profile = await TrainerProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return next(new AppError("You haven't set up a trainer profile yet", 404, 'NOT_FOUND'));
    }
    res.status(200).json({ profile });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/trainers/profile — create or update the logged-in trainer's own profile. */
async function upsertMyProfile(req, res, next) {
  try {
    const { bio, specializations, hourlyRate, availability } = req.body;
    const profile = await TrainerProfile.findOneAndUpdate(
      { userId: req.user.id },
      {
        userId: req.user.id,
        bio,
        specializations: specializations || [],
        hourlyRate,
        availability: availability || [],
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({ profile });
  } catch (err) {
    next(err);
  }
}

/** POST /api/trainers/:trainerId/bookings — a client books a session with this trainer. */
async function createBooking(req, res, next) {
  try {
    const trainer = await TrainerProfile.findById(req.params.trainerId);
    if (!trainer) {
      return next(new AppError('Trainer not found', 404, 'NOT_FOUND'));
    }
    if (String(trainer.userId) === String(req.user.id)) {
      return next(new AppError('You cannot book a session with yourself', 400, 'INVALID_BOOKING'));
    }

    const { scheduledAt, sessionMode } = req.body;
    const durationMinutes = req.body.durationMinutes || 60;
    const scheduledDate = new Date(scheduledAt);

    if (scheduledDate.getTime() <= Date.now()) {
      return next(new AppError('scheduledAt must be in the future', 400, 'VALIDATION_ERROR'));
    }

    if (!isWithinAvailability(scheduledDate, durationMinutes, trainer.availability)) {
      return next(
        new AppError("This time is outside the trainer's stated availability", 400, 'OUTSIDE_AVAILABILITY')
      );
    }

    const existing = await TrainerBooking.find({
      trainerId: trainer._id,
      status: { $in: ['pending', 'confirmed'] },
    });
    const conflict = existing.some((b) =>
      bookingsOverlap(scheduledDate, durationMinutes, b.scheduledAt, b.durationMinutes)
    );
    if (conflict) {
      return next(new AppError('This trainer already has a booking at that time', 409, 'SLOT_TAKEN'));
    }

    const price = computeSessionPrice(trainer.hourlyRate, durationMinutes);
    const videoRoomId = sessionMode === 'video' ? `room_${crypto.randomBytes(8).toString('hex')}` : undefined;

    const booking = await TrainerBooking.create({
      trainerId: trainer._id,
      clientId: req.user.id,
      scheduledAt: scheduledDate,
      durationMinutes,
      sessionMode,
      videoRoomId,
      price,
      status: 'pending',
    });

    // Mirrors the same mock-payment pattern used for gym memberships:
    // captured immediately since there's no real gateway wired in yet (see
    // paymentService.js). NOTE: a cancelled booking does NOT trigger a
    // refund here — that's a real gap, flagged rather than silently
    // assumed, same as the rest of the deferred payment work.
    await recordMockPayment({
      payerUserId: req.user.id,
      gymId: null,
      purpose: 'trainer_booking',
      relatedEntityId: booking._id,
      amount: price,
    });

    res.status(201).json({ booking });
  } catch (err) {
    next(err);
  }
}

/** GET /api/trainers/bookings/me — the logged-in user's own bookings as a CLIENT. */
async function listMyBookingsAsClient(req, res, next) {
  try {
    const bookings = await TrainerBooking.find({ clientId: req.user.id })
      .sort({ scheduledAt: -1 })
      .populate({
        path: 'trainerId',
        populate: { path: 'userId', select: 'profile.name profile.avatarUrl' },
      })
      .lean();
    res.status(200).json({ bookings });
  } catch (err) {
    next(err);
  }
}

/** GET /api/trainers/bookings/incoming — the logged-in trainer's incoming bookings. */
async function listMyBookingsAsTrainer(req, res, next) {
  try {
    const profile = await TrainerProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(200).json({ bookings: [] });
    }
    const bookings = await TrainerBooking.find({ trainerId: profile._id })
      .sort({ scheduledAt: -1 })
      .populate('clientId', 'profile.name profile.avatarUrl email')
      .lean();
    res.status(200).json({ bookings });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/trainers/bookings/:bookingId/status
 * The trainer may set confirmed/completed/cancelled. The client may only
 * cancel their own booking — they can't confirm or complete a session.
 */
async function updateBookingStatus(req, res, next) {
  try {
    const booking = await TrainerBooking.findById(req.params.bookingId);
    if (!booking) {
      return next(new AppError('Booking not found', 404, 'NOT_FOUND'));
    }

    const trainerProfile = await TrainerProfile.findById(booking.trainerId);
    const isTrainer = !!trainerProfile && String(trainerProfile.userId) === String(req.user.id);
    const isClient = String(booking.clientId) === String(req.user.id);

    if (!isTrainer && !isClient) {
      return next(new AppError('You are not part of this booking', 403, 'FORBIDDEN'));
    }

    const { status } = req.body;
    if (isClient && !isTrainer && status !== 'cancelled') {
      return next(new AppError('Clients may only cancel a booking', 403, 'FORBIDDEN'));
    }

    booking.status = status;
    await booking.save();
    res.status(200).json({ booking });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listTrainers,
  getTrainerById,
  getMyProfile,
  upsertMyProfile,
  createBooking,
  listMyBookingsAsClient,
  listMyBookingsAsTrainer,
  updateBookingStatus,
};