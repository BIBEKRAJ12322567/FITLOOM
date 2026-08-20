const { Attendance, Membership } = require('../models');
const AppError = require('../utils/AppError');

// A check-in is considered "open" (no checkout yet) for this long before
// we stop treating it as the active session and just let a fresh check-in
// start a new one. Prevents a forgotten checkout from blocking someone
// from checking in again the next day.
const OPEN_SESSION_WINDOW_MS = 12 * 60 * 60 * 1000; // 12 hours

// Every caller of this runs inside a route already wrapped by
// withGymParam, so the tenant context is open and Attendance's
// tenantScopePlugin auto-filters this query to the current :gymId — no
// need to pass gymId explicitly.
async function findOpenSession(userId) {
  return Attendance.findOne({
    userId,
    checkOutAt: null,
    checkInAt: { $gte: new Date(Date.now() - OPEN_SESSION_WINDOW_MS) },
  });
}

/**
 * POST /api/gyms/:gymId/attendance/check-in — a member checks themself in.
 * Requires an active membership at this gym (also what makes the QR-code
 * landing page in the frontend work as a "scan to check in" flow — the
 * QR just encodes this gym's check-in URL; the browser call is the "scan").
 * Idempotent within the open-session window: re-hitting this while
 * already checked in just returns the existing session instead of
 * creating a duplicate.
 */
async function checkIn(req, res, next) {
  try {
    const membership = await Membership.findOne({ userId: req.user.id, status: 'active' });
    if (!membership) {
      return next(
        new AppError("You don't have an active membership at this gym", 403, 'NO_ACTIVE_MEMBERSHIP')
      );
    }

    const existing = await findOpenSession(req.user.id);
    if (existing) {
      return res.status(200).json({ attendance: existing, alreadyCheckedIn: true });
    }

    const attendance = await Attendance.create({
      userId: req.user.id,
      checkInAt: new Date(),
      method: req.body?.method === 'qr' ? 'qr' : 'app',
    });

    res.status(201).json({ attendance, alreadyCheckedIn: false });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/gyms/:gymId/attendance/check-in/:memberId — front-desk staff
 * checks a member in manually (e.g. they forgot their phone). Requires
 * the manage_attendance permission — this is what that permission
 * actually gates, alongside the log view below.
 */
async function staffCheckIn(req, res, next) {
  try {
    const membership = await Membership.findOne({ userId: req.params.memberId, status: 'active' });
    if (!membership) {
      return next(new AppError('This person does not have an active membership here', 403, 'NO_ACTIVE_MEMBERSHIP'));
    }

    const existing = await findOpenSession(req.params.memberId);
    if (existing) {
      return res.status(200).json({ attendance: existing, alreadyCheckedIn: true });
    }

    const attendance = await Attendance.create({
      userId: req.params.memberId,
      checkInAt: new Date(),
      method: 'manual',
    });

    res.status(201).json({ attendance, alreadyCheckedIn: false });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/gyms/:gymId/attendance/check-out — closes the caller's open
 * session at this gym, if any. Not required for the leaderboard/overview
 * counts to work (those key off checkInAt), but lets a member log a
 * finished workout window and lets front-desk staff see who's currently
 * in the building (checkOutAt: null).
 */
async function checkOut(req, res, next) {
  try {
    const open = await findOpenSession(req.user.id);
    if (!open) {
      return next(new AppError('No open check-in found to close', 404, 'NOT_FOUND'));
    }
    open.checkOutAt = new Date();
    await open.save();
    res.status(200).json({ attendance: open });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/gyms/:gymId/attendance — front-desk log: everyone who's
 * checked in, most recent first. Requires manage_attendance. Separate
 * from getGymLeaderboard (30-day visit-count ranking) — this is the raw,
 * chronological log a staffer scans to see who's currently in the gym or
 * came in earlier today.
 */
async function listGymAttendance(req, res, next) {
  try {
    const { limit = 50 } = req.query;
    const records = await Attendance.find({})
      .populate('userId', 'email profile.name')
      .sort({ checkInAt: -1 })
      .limit(Number(limit))
      .lean();
    res.status(200).json({ attendance: records });
  } catch (err) {
    next(err);
  }
}

/** GET /api/gyms/:gymId/attendance/mine — the caller's own check-in history at this gym. */
async function listMyAttendance(req, res, next) {
  try {
    const records = await Attendance.find({ userId: req.user.id })
      .sort({ checkInAt: -1 })
      .limit(30)
      .lean();
    res.status(200).json({ attendance: records });
  } catch (err) {
    next(err);
  }
}

module.exports = { checkIn, staffCheckIn, checkOut, listGymAttendance, listMyAttendance };