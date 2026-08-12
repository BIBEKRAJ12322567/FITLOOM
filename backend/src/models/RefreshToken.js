const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * We never store the raw refresh token — only a SHA-256 hash of it (see
 * utils/jwt.js: hashToken). This means a database leak alone can't be used
 * to forge sessions. Rotation: every refresh call revokes the old token row
 * and inserts a new one, so a stolen refresh token can only be replayed once
 * before the legitimate user's next refresh invalidates it (detectable reuse).
 */
const refreshTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL index — Mongo auto-deletes expired rows
    revoked: { type: Boolean, default: false },
    replacedByHash: { type: String, default: null }, // set when rotated, useful for reuse-detection audits
    userAgent: String,
    ip: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
