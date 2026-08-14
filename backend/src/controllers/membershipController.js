const { MembershipPlan, Membership } = require('../models');
const AppError = require('../utils/AppError');
const { recordMockPayment } = require('../services/paymentService');

/** POST /api/gyms/:gymId/membership-plans — owner creates a plan. Requires requireGymOwner. */
async function createPlan(req, res, next) {
  try {
    const { name, durationDays, price, features } = req.body;
    // gymId is auto-injected by tenantScopePlugin from the open context
    // (withGymParam) — not read from req.params directly.
    const plan = await MembershipPlan.create({ name, durationDays, price, features: features || [] });
    res.status(201).json({ plan });
  } catch (err) {
    next(err);
  }
}

/** GET /api/gyms/:gymId/membership-plans — public + owner list. */
async function listPlans(req, res, next) {
  try {
    const plans = await MembershipPlan.find({ isActive: true }).lean();
    res.status(200).json({ plans });
  } catch (err) {
    next(err);
  }
}

/** POST /api/gyms/:gymId/memberships — a member joins this gym on a plan. */
async function joinGym(req, res, next) {
  try {
    const { planId } = req.body;

    const plan = await MembershipPlan.findById(planId);
    if (!plan || !plan.isActive) {
      return next(new AppError('Membership plan not found or inactive', 404, 'NOT_FOUND'));
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    const membership = await Membership.create({
      userId: req.user.id,
      planId: plan._id,
      startDate,
      endDate,
      status: 'active',
    });

    await recordMockPayment({
      payerUserId: req.user.id,
      gymId: req.params.gymId,
      purpose: 'membership',
      relatedEntityId: membership._id,
      amount: plan.price,
    });

    res.status(201).json({ membership });
  } catch (err) {
    next(err);
  }
}

/** POST /api/memberships/:membershipId/renew — extends an existing membership by its plan's duration. */
async function renewMembership(req, res, next) {
  try {
    // This route is NOT gym-scoped by URL param (no :gymId), so we can't
    // rely on the auto-injected tenant filter here — fetch the membership
    // first, then explicitly verify it belongs to the requesting user
    // before touching it.
    const membership = await Membership.findById(req.params.membershipId).setOptions({
      skipTenantScope: true,
    });
    if (!membership) {
      return next(new AppError('Membership not found', 404, 'NOT_FOUND'));
    }
    if (String(membership.userId) !== String(req.user.id)) {
      return next(new AppError('This is not your membership', 403, 'FORBIDDEN'));
    }

    const plan = await MembershipPlan.findById(membership.planId).setOptions({ skipTenantScope: true });
    if (!plan) {
      return next(new AppError('The plan for this membership no longer exists', 404, 'NOT_FOUND'));
    }

    // Renewal extends from whichever is later: today, or the current
    // expiry — so renewing early doesn't lose the remaining paid time.
    const base = membership.endDate > new Date() ? membership.endDate : new Date();
    membership.endDate = new Date(base.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
    membership.status = 'active';
    await membership.save();

    await recordMockPayment({
      payerUserId: req.user.id,
      gymId: membership.gymId,
      purpose: 'membership',
      relatedEntityId: membership._id,
      amount: plan.price,
    });

    res.status(200).json({ membership });
  } catch (err) {
    next(err);
  }
}

module.exports = { createPlan, listPlans, joinGym, renewMembership };