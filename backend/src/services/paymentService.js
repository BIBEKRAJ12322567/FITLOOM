const crypto = require('crypto');
const { Payment } = require('../models');
const AppError = require('../utils/AppError');

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

// Whether a real gateway is wired up. Checked at call time (not just once
// at module load) so tests/dev can flip env vars without a process
// restart, and so the rest of the app never has to know or care whether
// it's talking to Razorpay or the mock — same function signatures either
// way.
const isRazorpayConfigured = Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);

let razorpayInstance = null;
function getRazorpayInstance() {
  if (!isRazorpayConfigured) return null;
  if (!razorpayInstance) {
    // Required lazily — avoids a hard crash on module load in
    // environments that don't have the package installed for some reason,
    // and avoids constructing a client with undefined keys.
    const Razorpay = require('razorpay');
    razorpayInstance = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
  }
  return razorpayInstance;
}

/**
 * Records a payment as immediately captured, with no real gateway
 * involved. This is the whole payment flow when Razorpay isn't
 * configured (no RAZORPAY_KEY_ID/SECRET in env) — keeps local dev and
 * the seed/demo flow working end-to-end without requiring anyone to have
 * a Razorpay account.
 */
async function recordMockPayment({ payerUserId, gymId, purpose, relatedEntityId, amount, metadata = null }) {
  return Payment.create({
    payerUserId,
    gymId,
    purpose,
    relatedEntityId,
    amount,
    provider: 'razorpay',
    providerPaymentId: `mock_${crypto.randomBytes(12).toString('hex')}`,
    status: 'captured',
    metadata,
  });
}

/**
 * Step 1 of a real payment. Creates a Razorpay order (the thing the
 * frontend hands to Razorpay Checkout) and a local Payment row in
 * 'created' status that tracks it — NOT yet captured, since we haven't
 * heard back from the user completing checkout yet. providerPaymentId
 * temporarily holds the Razorpay *order* id; confirmPayment overwrites it
 * with the real *payment* id once the payment is verified and captured.
 *
 * Falls back to recordMockPayment (instant capture, `requiresPayment:
 * false`) when no gateway is configured, so every caller can use the same
 * shape regardless of environment — check `requiresPayment` and only
 * render a checkout UI when it's true.
 */
async function initiatePayment({
  payerUserId,
  gymId,
  purpose,
  relatedEntityId,
  amount,
  currency = 'INR',
  metadata = null,
}) {
  const rzp = getRazorpayInstance();

  if (!rzp) {
    const payment = await recordMockPayment({ payerUserId, gymId, purpose, relatedEntityId, amount, metadata });
    return { requiresPayment: false, payment };
  }

  const amountPaise = Math.round(amount * 100);
  const order = await rzp.orders.create({
    amount: amountPaise,
    currency,
    receipt: `${purpose}_${relatedEntityId}`.slice(0, 40),
    notes: { purpose, relatedEntityId: String(relatedEntityId) },
  });

  const payment = await Payment.create({
    payerUserId,
    gymId,
    purpose,
    relatedEntityId,
    amount,
    currency,
    provider: 'razorpay',
    providerPaymentId: order.id,
    status: 'created',
    metadata,
  });

  return {
    requiresPayment: true,
    payment,
    razorpayOrder: {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: RAZORPAY_KEY_ID,
    },
  };
}

/**
 * Verifies the HMAC-SHA256 signature Razorpay Checkout returns to the
 * frontend after a successful payment, per Razorpay's documented scheme:
 * signature = hmac_sha256(order_id + "|" + payment_id, key_secret).
 * Exported separately from confirmPayment so it's independently testable
 * without touching the database.
 */
function verifySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  const expected = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
  // Constant-time comparison — signatures are the same length (both hex
  // SHA-256 digests) so timingSafeEqual won't throw in the expected case,
  // but guard the length anyway since a forged/malformed signature from
  // the client could be any length.
  if (expected.length !== razorpaySignature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpaySignature));
}

/**
 * Step 2 of a real payment. Called once Razorpay Checkout completes on
 * the frontend and hands back razorpay_order_id/payment_id/signature.
 * Verifies the signature, then marks the Payment captured (or failed, if
 * the signature doesn't check out — which the caller should treat as a
 * failed payment, not touch the related membership/order).
 */
async function confirmPayment({ paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  if (!isRazorpayConfigured) {
    throw new AppError('Payment gateway is not configured', 500, 'GATEWAY_NOT_CONFIGURED');
  }

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new AppError('Payment not found', 404, 'NOT_FOUND');
  }
  if (payment.status === 'captured') {
    return payment; // idempotent — a retried/duplicate verify call is a no-op, not an error
  }
  if (payment.providerPaymentId !== razorpayOrderId) {
    throw new AppError('This payment does not match the given order', 400, 'PAYMENT_MISMATCH');
  }

  const valid = verifySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature });
  if (!valid) {
    payment.status = 'failed';
    await payment.save();
    throw new AppError('Payment signature verification failed', 400, 'PAYMENT_VERIFICATION_FAILED');
  }

  payment.providerPaymentId = razorpayPaymentId;
  payment.status = 'captured';
  await payment.save();
  return payment;
}

module.exports = {
  isRazorpayConfigured,
  recordMockPayment,
  initiatePayment,
  verifySignature,
  confirmPayment,
};