const mongoose = require('mongoose');
const { Gym, User, Membership, MembershipPlan, Attendance, Payment } = require('../models');
const AppError = require('../utils/AppError');

function slugify(name) {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * POST /api/gyms — a user registers their offline gym on the platform.
 * Promotes them to gym_owner and sets this as their activeGymId (used by
 * resolveTenant middleware for their future staff-side dashboard requests).
 */
async function registerGym(req, res, next) {
  try {
    const { name, address, contactPhone, facilities, description } = req.body;

    let slug = slugify(name);
    const existing = await Gym.findOne({ slug });
    if (existing) {
      // Cheap collision handling — append a short suffix rather than
      // rejecting the registration outright over a name clash.
      slug = `${slug}-${Date.now().toString(36).slice(-5)}`;
    }

    const gym = await Gym.create({
      ownerId: req.user.id,
      name,
      slug,
      address,
      contactPhone,
      facilities: facilities || [],
      description,
    });

    await User.findByIdAndUpdate(req.user.id, { role: 'gym_owner', activeGymId: gym._id });

    res.status(201).json({ gym });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/gyms — public browsing/search, for a member looking for their gym
 * or comparing options. Not tenant-scoped (browsing across gyms is the point).
 */
async function listGyms(req, res, next) {
  try {
    const { city, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (city) filter['address.city'] = new RegExp(`^${city}$`, 'i');
    if (search) filter.name = new RegExp(search, 'i');

    const skip = (Number(page) - 1) * Number(limit);
    const [gyms, total] = await Promise.all([
      Gym.find(filter)
        .select('name slug address logoUrl facilities ratingAvg ratingCount')
        .sort({ ratingAvg: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Gym.countDocuments(filter),
    ]);

    res.status(200).json({ gyms, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (err) {
    next(err);
  }
}

/** GET /api/gyms/:gymId — public gym profile, including plans and reviews summary. */
async function getGymDetail(req, res, next) {
  try {
    const gym = await Gym.findById(req.params.gymId).lean();
    if (!gym) {
      return next(new AppError('Gym not found', 404, 'NOT_FOUND'));
    }

    // Tenant context is already open for this gymId via withGymParam
    // middleware, so this query is auto-scoped by the tenantScopePlugin —
    // no need to pass gymId explicitly here.
    const plans = await MembershipPlan.find({ isActive: true })
      .select('name durationDays price features')
      .lean();

    res.status(200).json({ gym, plans });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/gyms/:gymId/overview — owner dashboard summary: revenue,
 * active member count, today's attendance. Requires requireGymOwner.
 */
async function getGymOverview(req, res, next) {
  try {
    const gymId = req.params.gymId;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Membership/Attendance are tenant-scoped models, so these two queries
    // are auto-filtered to this gym via the open tenant context (set by
    // withGymParam). Payment is NOT tenant-scoped (see Payment.js), so its
    // query needs gymId passed explicitly.
    const [activeMemberCount, todayAttendanceCount, revenueAgg] = await Promise.all([
      Membership.countDocuments({ status: 'active' }),
      Attendance.countDocuments({ checkInAt: { $gte: startOfToday } }),
      Payment.aggregate([
        {
          $match: {
            gymId: new mongoose.Types.ObjectId(gymId),
            status: 'captured',
            purpose: { $in: ['membership', 'order'] },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    res.status(200).json({
      gym: req.gym,
      activeMemberCount,
      todayAttendanceCount,
      totalRevenue: revenueAgg[0]?.total || 0,
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/gyms/:gymId/members — owner's member roster with plan + last check-in. */
async function getGymMembers(req, res, next) {
  try {
    const { status = 'active', page = 1, limit = 25 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [memberships, total] = await Promise.all([
      Membership.find({ status })
        .populate('userId', 'email profile.name')
        .populate('planId', 'name durationDays price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Membership.countDocuments({ status }),
    ]);

    res.status(200).json({ members: memberships, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/gyms/:gymId/leaderboard — ranks members by attendance count in
 * the last 30 days. Simple, self-contained aggregation; a real "streak"-
 * based ranking would need to read User.gamification, which is a
 * reasonable v2 refinement, not required for a first working leaderboard.
 */
async function getGymLeaderboard(req, res, next) {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const leaderboard = await Attendance.aggregate([
      {
        $match: {
          gymId: new mongoose.Types.ObjectId(req.params.gymId),
          checkInAt: { $gte: thirtyDaysAgo },
        },
      },
      { $group: { _id: '$userId', visitCount: { $sum: 1 } } },
      { $sort: { visitCount: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          _id: 0,
          visitCount: 1,
          name: '$user.profile.name',
        },
      },
    ]);

    res.status(200).json({ leaderboard });
  } catch (err) {
    next(err);
  }
}
/**
 * GET /api/gyms/mine — the logged-in user's own gyms (as owner). Consumed
 * by MyGym.jsx (shows "gyms you own") and OwnerDashboard.jsx (auto-selects
 * a gym to manage when no ?gymId is present in the URL). Both were already
 * calling gymApi.listMine() -> GET /gyms/mine before this route existed,
 * which meant it fell through to GET /gyms/:gymId with gymId="mine" and
 * threw a Mongoose CastError — a real bug, not a hypothetical one.
 */
async function getMyGyms(req, res, next) {
  try {
    const gyms = await Gym.find({ ownerId: req.user.id })
      .select('name slug address logoUrl subscriptionPlan subscriptionStatus')
      .lean();
    res.status(200).json({ gyms });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  registerGym,
  listGyms,
  getGymDetail,
  getGymOverview,
  getGymMembers,
  getGymLeaderboard,
  getMyGyms,
};
