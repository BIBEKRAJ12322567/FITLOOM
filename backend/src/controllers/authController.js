const authService = require('../services/authService');
const { User } = require('../models');
const AppError = require('../utils/AppError');

function requestMeta(req) {
  return { userAgent: req.headers['user-agent'], ip: req.ip };
}

async function register(req, res, next) {
  try {
    const { email, password, name, role } = req.body;
    const { user, accessToken, refreshToken } = await authService.register({
      email,
      password,
      name,
      role,
    });
    res.status(201).json({ user, accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await authService.login(
      { email, password },
      requestMeta(req)
    );
    res.status(200).json({ user, accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refresh(refreshToken, requestMeta(req));
    res.status(200).json({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function logoutAll(req, res, next) {
  try {
    await authService.logoutAllSessions(req.user.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

// Fields of the embedded `profile` subdocument a user may edit about
// themselves. Deliberately excludes email/password/role/subscriptionTier/
// gamification — those aren't part of this form and shouldn't become
// editable just because a client sends them.
const EDITABLE_PROFILE_FIELDS = [
  'name',
  'avatarUrl',
  'dob',
  'gender',
  'heightCm',
  'weightKg',
  'goals',
  'injuries',
  'experienceLevel',
];

async function updateProfile(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    for (const field of EDITABLE_PROFILE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        user.profile[field] = req.body[field];
      }
    }

    await user.save();
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, logout, logoutAll, me, updateProfile };