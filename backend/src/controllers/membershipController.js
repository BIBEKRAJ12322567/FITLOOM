const { MembershipPlan, Membership } = require('../models');
const AppError = require('../utils/AppError');
const paymentService = require('../services/paymentService');

/** POST /api/gyms/:gymId/membership-plans — owner/staff-with-permission creates a plan. */
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

/**
 * POST /api/gyms/:gymId/memberships — a member joins this gym on a plan.
 *
 * Two-phase when a real gateway is configured: the membership is created
 * as 'pending_payment' (not counted as active anywhere — getGymOverview's
 * activeMemberCount filters on status: 'active') and only flips to
 * 'active' once /api/payments/:paymentId/verify confirms the Razorpay
 * payment. With no gateway configured, paymentService's mock path
 * captures instantly and this activates the membership immediately, same
 * as before real payments existed.
 */
async function joinGym(req, res, next) {
  try {
    const { planId } = req.body;

    const plan = await MembershipPlan.findById(planId);
    if (!plan || !plan.isActive) {
      return next(new AppError('Membership plan not found or inactive', 404, 'NOT_FOUND'));
    }

    // Placeholder dates, required by the schema — overwritten with real
    // ones once payment is confirmed (paymentController.finalizeMembershipPayment).
    // Harmless in the meantime since 'pending_payment' status keeps this
    // membership out of every active-member query.
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    const membership = await Membership.create({
      userId: req.user.id,
      planId: plan._id,
      startDate,
      endDate,
      status: paymentService.isRazorpayConfigured ? 'pending_payment' : 'active',
    });

    const paymentResult = await paymentService.initiatePayment({
      payerUserId: req.user.id,
      gymId: req.params.gymId,
      purpose: 'membership',
      relatedEntityId: membership._id,
      amount: plan.price,
      metadata: { action: 'join' },
    });

    res.status(201).json({
      membership,
      requiresPayment: paymentResult.requiresPayment,
      payment: paymentResult.payment,
      razorpayOrder: paymentResult.razorpayOrder || null,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/memberships/:membershipId/renew — extends an existing
 * membership by its plan's duration.
 *
 * With a real gateway configured, the extension itself is deferred to
 * /api/payments/:paymentId/verify (see paymentController.finalizeMembershipPayment)
 * so a renewal isn't granted before payment is actually confirmed. With no
 * gateway configured, extends immediately — identical to the original
 * mock-only behavior.
 */
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

    const paymentResult = await paymentService.initiatePayment({
      payerUserId: req.user.id,
      gymId: membership.gymId,
      purpose: 'membership',
      relatedEntityId: membership._id,
      amount: plan.price,
      metadata: { action: 'renew' },
    });

    if (!paymentResult.requiresPayment) {
      // Renewal extends from whichever is later: today, or the current
      // expiry — so renewing early doesn't lose the remaining paid time.
      const base = membership.endDate > new Date() ? membership.endDate : new Date();
      membership.endDate = new Date(base.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
      membership.status = 'active';
      await membership.save();
    }

    res.status(200).json({
      membership,
      requiresPayment: paymentResult.requiresPayment,
      payment: paymentResult.payment,
      razorpayOrder: paymentResult.razorpayOrder || null,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/memberships/mine — every membership this user holds, across all
 * gyms. Not gym-scoped (no :gymId in the URL), so tenant scoping is
 * bypassed the same way renewMembership does it above.
 */
async function listMyMemberships(req, res, next) {
  try {
    const memberships = await Membership.find({ userId: req.user.id })
      .setOptions({ skipTenantScope: true })
      .populate('gymId', 'name slug')
      .populate('planId', 'name durationDays price')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ memberships });
  } catch (err) {
    next(err);
  }
}

module.exports = { createPlan, listPlans, joinGym, renewMembership, listMyMemberships };