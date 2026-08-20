const { User, GymStaffMember } = require('../models');
const AppError = require('../utils/AppError');

/**
 * POST /api/gyms/:gymId/staff — owner invites an existing FitLoom user to
 * help run this gym, with a specific set of permissions.
 *
 * Deliberately requires the invitee to already have a FitLoom account
 * (looked up by email) rather than emailing a brand-new address — that
 * would need an email-sending service wired in, which is out of scope
 * here the same way the real payment gateway was until now. This keeps
 * the feature fully working end-to-end today.
 */
async function inviteStaff(req, res, next) {
  try {
    const { email, permissions } = req.body;

    const invitee = await User.findOne({ email: email.toLowerCase().trim() });
    if (!invitee) {
      return next(
        new AppError(
          'No FitLoom account found for that email — the person needs to register first',
          404,
          'USER_NOT_FOUND'
        )
      );
    }

    if (String(invitee._id) === String(req.gym.ownerId)) {
      return next(new AppError('The gym owner already has full access', 422, 'ALREADY_OWNER'));
    }

    // Re-inviting someone previously revoked reactivates their existing
    // row (and refreshes their permission set) rather than violating the
    // unique gymId+userId index with a duplicate.
    let staffRecord = await GymStaffMember.findOne({
      gymId: req.gym._id,
      userId: invitee._id,
    }).setOptions({ skipTenantScope: true });

    if (staffRecord) {
      staffRecord.permissions = permissions;
      staffRecord.status = 'active';
      staffRecord.invitedBy = req.user.id;
      await staffRecord.save();
    } else {
      staffRecord = await GymStaffMember.create({
        gymId: req.gym._id,
        userId: invitee._id,
        permissions,
        invitedBy: req.user.id,
      });
    }

    // Mirrors what registerGym does for a new owner: promoting the role
    // and pointing activeGymId at this gym so resolveTenant scopes their
    // future staff-side dashboard requests correctly. Only downgrade a
    // plain 'user' — never touch someone who is already an owner/admin/
    // trainer elsewhere, since this invite shouldn't strip a role they
    // hold for other reasons.
    if (invitee.role === 'user') {
      await User.findByIdAndUpdate(invitee._id, { role: 'gym_staff', activeGymId: req.gym._id });
    }

    res.status(201).json({ staffMember: staffRecord });
  } catch (err) {
    next(err);
  }
}

/** GET /api/gyms/:gymId/staff — owner's roster of delegated staff accounts. */
async function listStaff(req, res, next) {
  try {
    const staff = await GymStaffMember.find({ gymId: req.gym._id })
      .setOptions({ skipTenantScope: true })
      .populate('userId', 'email profile.name')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ staff });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/gyms/:gymId/staff/:staffMemberId — owner changes what a staffer can do. */
async function updateStaffPermissions(req, res, next) {
  try {
    const { permissions } = req.body;

    const staffRecord = await GymStaffMember.findOne({
      _id: req.params.staffMemberId,
      gymId: req.gym._id,
    }).setOptions({ skipTenantScope: true });

    if (!staffRecord) {
      return next(new AppError('Staff member not found for this gym', 404, 'NOT_FOUND'));
    }

    staffRecord.permissions = permissions;
    await staffRecord.save();

    res.status(200).json({ staffMember: staffRecord });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/gyms/:gymId/staff/:staffMemberId — owner revokes access.
 * Marks the record revoked rather than deleting it (audit trail), and
 * clears the user's role/activeGymId back to 'user' if this was the last
 * gym they had active staff access to.
 */
async function removeStaff(req, res, next) {
  try {
    const staffRecord = await GymStaffMember.findOne({
      _id: req.params.staffMemberId,
      gymId: req.gym._id,
    }).setOptions({ skipTenantScope: true });

    if (!staffRecord) {
      return next(new AppError('Staff member not found for this gym', 404, 'NOT_FOUND'));
    }

    staffRecord.status = 'revoked';
    await staffRecord.save();

    const stillStaffElsewhereCount = await GymStaffMember.countDocuments({
      userId: staffRecord.userId,
      status: 'active',
    }).setOptions({ skipTenantScope: true });

    if (stillStaffElsewhereCount === 0) {
      const user = await User.findById(staffRecord.userId);
      if (user && user.role === 'gym_staff') {
        user.role = 'user';
        user.activeGymId = null;
        await user.save();
      }
    }

    res.status(200).json({ staffMember: staffRecord });
  } catch (err) {
    next(err);
  }
}

module.exports = { inviteStaff, listStaff, updateStaffPermissions, removeStaff };