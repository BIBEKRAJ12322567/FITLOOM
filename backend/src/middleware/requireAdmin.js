const AppError = require('../utils/AppError');

/** Gates a route to platform admins only. No gym/staff bypass — unlike
 * requireGymPermission, there's no "owner of this one thing" equivalent
 * here; admin is a platform-wide role or it's nothing. */
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return next(new AppError('Admin access required', 403, 'FORBIDDEN'));
  }
  next();
}

module.exports = requireAdmin;