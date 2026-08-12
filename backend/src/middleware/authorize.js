const AppError = require('../utils/AppError');

/**
 * Usage: router.post('/gyms', authenticate, authorize('gym_owner', 'admin'), createGym)
 * Must run after `authenticate` (needs req.user.role).
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401, 'UNAUTHENTICATED'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403, 'FORBIDDEN'));
    }
    next();
  };
}

module.exports = authorize;
