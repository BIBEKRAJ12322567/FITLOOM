const rateLimit = require('express-rate-limit');

// Applied only to login/register — deliberately stricter than general API
// rate limits, since these endpoints are the ones brute-force/credential
// stuffing attacks target.
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many attempts, please try again later' } },
});

module.exports = authRateLimiter;
