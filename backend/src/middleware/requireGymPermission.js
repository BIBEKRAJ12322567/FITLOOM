const { Gym, GymStaffMember } = require('../models');
const AppError = require('../utils/AppError');

/**
 * Like requireGymOwner, but also lets in a delegated staff account that
 * holds the specific `permission` given — e.g.
 * requireGymPermission('manage_members') passes for the owner (always),
 * a platform admin (always), or a GymStaffMember with 'manage_members' in
 * their permissions list.
 *
 * Attaches the loaded gym document as req.gym, same as requireGymOwner,
 * so downstream handlers don't need to re-fetch it either way.
 */
function requireGymPermission(permission) {
  return async function requireGymPermissionMiddleware(req, res, next) {
    try {
      const gym = await Gym.findById(req.params.gymId);
      if (!gym) {
        return next(new AppError('Gym not found', 404, 'NOT_FOUND'));
      }
      req.gym = gym;

      const isOwner = String(gym.ownerId) === String(req.user.id);
      const isAdmin = req.user.role === 'admin';
      if (isOwner || isAdmin) {
        return next();
      }

      const staffRecord = await GymStaffMember.findOne({
        gymId: gym._id,
        userId: req.user.id,
        status: 'active',
      }).setOptions({ skipTenantScope: true });

      if (!staffRecord || !staffRecord.permissions.includes(permission)) {
        return next(new AppError('You do not have permission to do this', 403, 'FORBIDDEN'));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = requireGymPermission;