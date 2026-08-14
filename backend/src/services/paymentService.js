const crypto = require('crypto');
const { Payment } = require('../models');

/**
 * Records a payment as immediately captured. There's no real payment
 * gateway wired in yet (Razorpay/Stripe) — that's a deliberate scope cut
 * for the offline-gym feature build, the same call as deferring the
 * renewal-reminder background job. This keeps the membership/order flow
 * fully working end-to-end now, with a single, clearly-marked function to
 * swap for real gateway integration later without touching the
 * membership/order logic that calls it.
 */
async function recordMockPayment({ payerUserId, gymId, purpose, relatedEntityId, amount }) {
  return Payment.create({
    payerUserId,
    gymId,
    purpose,
    relatedEntityId,
    amount,
    provider: 'razorpay',
    providerPaymentId: `mock_${crypto.randomBytes(12).toString('hex')}`,
    status: 'captured',
  });
}

module.exports = { recordMockPayment };