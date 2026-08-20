const { Membership, MembershipPlan, Order } = require('../models');
const AppError = require('../utils/AppError');
const paymentService = require('../services/paymentService');

/**
 * Runs after a membership payment is confirmed captured — activates a
 * fresh 'pending_payment' membership (join), or extends an already-active/
 * expired one (renew), based on the `action` recorded in
 * payment.metadata when the payment was initiated (see
 * membershipController.joinGym / renewMembership).
 */
async function finalizeMembershipPayment(payment) {
  const membership = await Membership.findById(payment.relatedEntityId).setOptions({ skipTenantScope: true });
  if (!membership) return; // defensive — the membership row should always exist by this point

  const plan = await MembershipPlan.findById(membership.planId).setOptions({ skipTenantScope: true });
  if (!plan) return;

  if (payment.metadata?.action === 'renew') {
    const base = membership.endDate > new Date() ? membership.endDate : new Date();
    membership.endDate = new Date(base.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
  } else {
    // join — start the clock fresh from confirmation time rather than
    // whatever placeholder dates were set when the pending row was created.
    membership.startDate = new Date();
    membership.endDate = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);
  }
  membership.status = 'active';
  await membership.save();
}

/** Runs after an order payment is confirmed captured — marks the order paid. */
async function finalizeOrderPayment(payment) {
  await Order.updateOne(
    { _id: payment.relatedEntityId },
    { status: 'paid', paymentId: payment._id }
  ).setOptions({ skipTenantScope: true });
}

/**
 * POST /api/payments/:paymentId/verify — called by the frontend once
 * Razorpay Checkout completes, with the three values Razorpay hands back
 * (razorpay_order_id, razorpay_payment_id, razorpay_signature). This is
 * the single place that actually grants access after a real payment —
 * membership/order creation never activates anything itself when a
 * gateway is configured, it only gets finalized here once the signature
 * checks out.
 */
async function verifyPayment(req, res, next) {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const payment = await paymentService.confirmPayment({
      paymentId: req.params.paymentId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (String(payment.payerUserId) !== String(req.user.id)) {
      return next(new AppError('This is not your payment', 403, 'FORBIDDEN'));
    }

    if (payment.purpose === 'membership') {
      await finalizeMembershipPayment(payment);
    } else if (payment.purpose === 'order') {
      await finalizeOrderPayment(payment);
    }
    // Other purposes (user_subscription, gym_subscription, trainer_booking)
    // aren't wired to a real checkout flow yet — nothing to finalize.

    res.status(200).json({ payment });
  } catch (err) {
    next(err);
  }
}

module.exports = { verifyPayment };