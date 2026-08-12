const { runWithGym } = require('../context/tenantContext');

/**
 * Must run AFTER your auth middleware (the one that sets req.user from the JWT).
 *
 * Expects req.user.activeGymId to be present for gym_owner / gym_staff / trainer
 * sessions (set at login time / gym-switch time). For plain end users (role 'user')
 * there is no active gym — tenant-scoped routes simply won't apply to them.
 *
 * Usage in app.js:
 *   app.use(authenticate);       // sets req.user
 *   app.use(resolveTenant);      // opens tenant context for this request
 *   app.use('/api/gyms', gymRoutes);
 */
function resolveTenant(req, res, next) {
  const gymId =
    (req.user && req.user.activeGymId) ||
    req.headers['x-gym-id'] || // fallback for endpoints that pass it explicitly (e.g. admin tools)
    null;

  runWithGym(gymId, () => next());
}

module.exports = resolveTenant;
