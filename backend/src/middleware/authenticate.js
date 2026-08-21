const { verifyAccessToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');
const { User } = require('../models');

/**
 * Verifies the access token and attaches a minimal req.user (from the JWT
 * claims, not a fresh DB read — keeps this middleware fast on every request).
 * Route handlers that need fresh profile data should fetch the user
 * themselves; req.user here is for identity/authorization decisions only.
 *
 * Must run BEFORE resolveTenant middleware (which reads req.user.activeGymId).
 */
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new AppError('Missing or malformed Authorization header', 401, 'UNAUTHENTICATED');
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (err) {
      const code = err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
      throw new AppError('Invalid or expired access token', 401, code);
    }

    // Cheap existence + suspension check so a deleted or newly-suspended
    // account can't keep using a still-valid access token for the
    // remainder of its 15-minute life — suspending someone should take
    // effect on their very next request, not wait for token expiry.
    const user = await User.findById(payload.sub).select('isSuspended').lean();
    if (!user) {
      throw new AppError('User no longer exists', 401, 'UNAUTHENTICATED');
    }
    if (user.isSuspended) {
      throw new AppError('This account has been suspended', 403, 'ACCOUNT_SUSPENDED');
    }

    req.user = {
      id: payload.sub,
      role: payload.role,
      activeGymId: payload.activeGymId,
    };

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authenticate;