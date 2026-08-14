const { runWithGym } = require('../context/tenantContext');

/**
 * resolveTenant.js (already existing) scopes requests to req.user.activeGymId
 * — that's correct for gym staff/owners operating within their one managed
 * gym. But a member browsing, joining, reviewing, or buying from ANY gym is
 * a different access pattern: the gym they're acting on is whichever one is
 * in the URL, not a fixed "active" gym on their account.
 *
 * This middleware opens the tenant context from req.params.gymId instead,
 * so the SAME tenantScopePlugin enforcement on Membership/Product/Order/etc.
 * still applies correctly — it just gets its gymId from a different place.
 *
 * Usage: router.post('/gyms/:gymId/memberships', authenticate, withGymParam, joinGym)
 */
function withGymParam(req, res, next) {
  const gymId = req.params.gymId;
  if (!gymId) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'gymId param is required' } });
  }
  runWithGym(gymId, () => next());
}

module.exports = withGymParam;