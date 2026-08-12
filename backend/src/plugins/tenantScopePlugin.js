const mongoose = require('mongoose');
const { getCurrentGymId } = require('../context/tenantContext');

const READ_QUERY_HOOKS = [
  'find',
  'findOne',
  'findOneAndUpdate',
  'findOneAndDelete',
  'countDocuments',
  'updateMany',
  'updateOne',
  'deleteMany',
  'deleteOne',
];

/**
 * Apply this plugin to every tenant-scoped schema (memberships, membershipPlans,
 * attendance, products, orders, gymTrainers). It:
 *
 *   1. Adds a required, indexed `gymId` field to the schema.
 *   2. On save: auto-fills gymId from the current tenant context if not set explicitly.
 *   3. On every read/update/delete query: auto-injects { gymId } into the filter
 *      from the current tenant context, UNLESS the query explicitly opts out.
 *
 * Opting out (rare, e.g. platform admin cross-tenant reporting):
 *   Model.find(filter).setOptions({ skipTenantScope: true })
 *
 * This is a safety net, not a replacement for checking req.user's actual gym
 * access in the controller — see resolveTenant.js middleware for why.
 */
function tenantScopePlugin(schema, options = {}) {
  const fieldName = (options && options.fieldName) || 'gymId';

  schema.add({
    [fieldName]: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      required: true,
      index: true,
    },
  });

  schema.pre('save', function tenantScopeOnSave(next) {
    if (!this[fieldName]) {
      const contextGymId = getCurrentGymId();
      if (contextGymId) {
        this[fieldName] = contextGymId;
      }
    }
    if (!this[fieldName]) {
      return next(
        new Error(
          `tenantScopePlugin: cannot save "${schema.options.collection || 'document'}" without ${fieldName}. ` +
            'Set it explicitly or ensure the request went through resolveTenant middleware.'
        )
      );
    }
    next();
  });

  READ_QUERY_HOOKS.forEach((hook) => {
    schema.pre(hook, function tenantScopeOnQuery(next) {
      if (this.getOptions().skipTenantScope) {
        return next();
      }

      const existing = this.getFilter()[fieldName];
      if (existing) {
        // Filter already specifies gymId explicitly — respect it, but only if it
        // matches the current context (prevents a bug from silently leaking
        // cross-tenant data by passing the wrong gymId).
        const contextGymId = getCurrentGymId();
        if (contextGymId && String(existing) !== String(contextGymId)) {
          return next(
            new Error(
              `tenantScopePlugin: query gymId (${existing}) does not match active tenant context (${contextGymId}).`
            )
          );
        }
        return next();
      }

      const contextGymId = getCurrentGymId();
      if (!contextGymId) {
        return next(
          new Error(
            `tenantScopePlugin: no active tenant context for query on "${schema.options.collection || 'collection'}". ` +
              'Pass { gymId } explicitly or use .setOptions({ skipTenantScope: true }) for intentional cross-tenant access.'
          )
        );
      }

      this.where({ [fieldName]: contextGymId });
      next();
    });
  });
}

module.exports = tenantScopePlugin;
