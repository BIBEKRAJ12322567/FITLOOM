const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/env');

/**
 * Access token payload is intentionally minimal: sub (userId), role, and
 * activeGymId (read by resolveTenant middleware). Never put anything
 * sensitive or slow-changing-but-cacheable (like email) in here that you'd
 * regret being unable to instantly revoke — access tokens live for 15
 * minutes precisely so stale claims self-correct quickly.
 */
function signAccessToken(user) {
  return jwt.sign(
    {
      sub: String(user._id),
      role: user.role,
      activeGymId: user.activeGymId ? String(user.activeGymId) : null,
    },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessTtl }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.accessSecret);
}

/**
 * Refresh tokens are opaque random strings, NOT JWTs. This is deliberate:
 * a JWT refresh token is self-verifying and can't be revoked before expiry
 * without a blocklist anyway, so there's no benefit over a random token —
 * and a random token is simpler to reason about and DB-revoke (see
 * RefreshToken model, which stores only the hash).
 */
function generateRefreshToken() {
  return crypto.randomBytes(48).toString('hex');
}

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function refreshExpiryDate() {
  const days = config.jwt.refreshTtlDays;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashToken,
  refreshExpiryDate,
};
