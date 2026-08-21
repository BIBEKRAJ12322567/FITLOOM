const bcrypt = require('bcryptjs');
const { User, RefreshToken } = require('../models');
const AppError = require('../utils/AppError');
const config = require('../config/env');
const {
  signAccessToken,
  generateRefreshToken,
  hashToken,
  refreshExpiryDate,
} = require('../utils/jwt');

async function issueTokenPair(user, meta = {}) {
  const accessToken = signAccessToken(user);
  const rawRefreshToken = generateRefreshToken();

  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(rawRefreshToken),
    expiresAt: refreshExpiryDate(),
    userAgent: meta.userAgent,
    ip: meta.ip,
  });

  return { accessToken, refreshToken: rawRefreshToken };
}

async function register({ email, password, name, role }) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError('An account with this email already exists', 409, 'EMAIL_TAKEN');
  }

  const passwordHash = await bcrypt.hash(password, config.bcryptSaltRounds);

  const user = await User.create({
    email,
    passwordHash,
    role: role || 'user',
    profile: { name },
  });

  const tokens = await issueTokenPair(user);
  return { user, ...tokens };
}

async function login({ email, password }, meta = {}) {
  const user = await User.findOne({ email }).select('+passwordHash').exec();

  // Deliberately identical error for "no such user" and "wrong password" —
  // distinguishing them lets an attacker enumerate registered emails.
  if (!user || !user.passwordHash) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  if (user.isSuspended) {
    throw new AppError('This account has been suspended. Contact support for details.', 403, 'ACCOUNT_SUSPENDED');
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const tokens = await issueTokenPair(user, meta);
  return { user, ...tokens };
}

/**
 * Rotates the refresh token: the presented token is revoked and a new one
 * issued, even though the old one hadn't expired yet. If a revoked token is
 * presented again, that's a signal of token theft/replay — we revoke the
 * entire lineage as a precaution.
 */
async function refresh(rawRefreshToken, meta = {}) {
  const tokenHash = hashToken(rawRefreshToken);
  const stored = await RefreshToken.findOne({ tokenHash });

  if (!stored) {
    throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
  }

  if (stored.revoked) {
    // Reuse of an already-rotated token — revoke every active token for this
    // user as a precaution against a stolen token being replayed.
    await RefreshToken.updateMany(
      { userId: stored.userId, revoked: false },
      { $set: { revoked: true } }
    );
    throw new AppError(
      'Refresh token reuse detected — all sessions revoked, please log in again',
      401,
      'REFRESH_TOKEN_REUSED'
    );
  }

  if (stored.expiresAt < new Date()) {
    throw new AppError('Refresh token expired', 401, 'REFRESH_TOKEN_EXPIRED');
  }

  const user = await User.findById(stored.userId);
  if (!user) {
    throw new AppError('User no longer exists', 401, 'UNAUTHENTICATED');
  }

  const newRawRefreshToken = generateRefreshToken();
  stored.revoked = true;
  stored.replacedByHash = hashToken(newRawRefreshToken);
  await stored.save();

  await RefreshToken.create({
    userId: user._id,
    tokenHash: stored.replacedByHash,
    expiresAt: refreshExpiryDate(),
    userAgent: meta.userAgent,
    ip: meta.ip,
  });

  const accessToken = signAccessToken(user);
  return { user, accessToken, refreshToken: newRawRefreshToken };
}

async function logout(rawRefreshToken) {
  const tokenHash = hashToken(rawRefreshToken);
  await RefreshToken.updateOne({ tokenHash }, { $set: { revoked: true } });
}

async function logoutAllSessions(userId) {
  await RefreshToken.updateMany({ userId, revoked: false }, { $set: { revoked: true } });
}

module.exports = { register, login, refresh, logout, logoutAllSessions };