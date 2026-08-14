const { Gym } = require('../models');
const AppError = require('../utils/AppError');

/**
 * Checks that req.user is actually the owner (or a platform admin) of
 * req.params.gymId — not just that they *have* the gym_owner role, or that
 * their JWT's activeGymId happens to say so. Confirming against the real
 * Gym.ownerId on every request is slightly more DB work than trusting the
 * JWT, but it means a stale/forged activeGymId claim can never grant access
 * to a gym someone doesn't actually own.
 *
 * Attaches the loaded gym document as req.gym so downstream handlers don't
 * need to re-fetch it.
 *
 * NOTE: this checks ownership only, not gym_staff. Staff-level permissions
 * (a gym owner delegating dashboard access to an employee) are a real gap —
 * GymTrainer/staff records exist in the data model but this middleware
 * doesn't check them yet. Flagged here rather than silently assumed.
 */
async function requireGymOwner(req, res, next) {
  try {
    const gym = await Gym.findById(req.params.gymId);
    if (!gym) {
      return next(new AppError('Gym not found', 404, 'NOT_FOUND'));
    }

    const isOwner = String(gym.ownerId) === String(req.user.id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return next(new AppError('You do not manage this gym', 403, 'FORBIDDEN'));
    }

    req.gym = gym;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = requireGymOwner;