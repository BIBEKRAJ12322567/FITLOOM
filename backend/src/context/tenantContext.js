const { AsyncLocalStorage } = require('async_hooks');

/**
 * Holds the current request's tenant (gym) context for the lifetime of that request.
 * This lets the tenantScope Mongoose plugin auto-inject { gymId } into queries
 * without every service function having to accept and pass gymId manually.
 *
 * IMPORTANT: this is a convenience layer, not the source of truth for authorization.
 * Every tenant-scoped write must still be checked against req.user's actual gym
 * membership/role in the route/controller layer — this context only fills in the
 * query filter, it does not perform access control.
 */
const storage = new AsyncLocalStorage();

function runWithGym(gymId, fn) {
  return storage.run({ gymId: gymId ? String(gymId) : null }, fn);
}

function getCurrentGymId() {
  const store = storage.getStore();
  return store ? store.gymId : null;
}

module.exports = { runWithGym, getCurrentGymId };
