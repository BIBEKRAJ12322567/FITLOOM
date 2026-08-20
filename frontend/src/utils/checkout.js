import { paymentApi } from '../api/paymentApi';

let scriptLoadingPromise = null;

// Razorpay Checkout is loaded from their CDN on demand — not bundled —
// so pages that never touch a paid flow (most of the app) don't pay for
// it. Cached as a module-level promise so opening checkout twice in one
// session doesn't re-inject the script tag.
function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve();
  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Could not load the payment widget. Check your connection and try again.'));
    document.body.appendChild(script);
  });
  return scriptLoadingPromise;
}

/**
 * Opens Razorpay Checkout for a payment that the backend's initiatePayment
 * flagged as `requiresPayment: true` (i.e. a real gateway is configured),
 * then verifies the result with the backend on success.
 *
 * Callers only need this when `requiresPayment` is true — when it's
 * false (no gateway configured, backend already mock-captured and
 * finalized everything), there's nothing to check out.
 *
 * Resolves with the verified, captured Payment doc. Rejects if the user
 * closes the modal, the payment fails, or backend verification fails —
 * callers should show `err.message` (or `err.response?.data?.error?.message`
 * for a verification-endpoint failure) rather than treating rejection as
 * a hard crash, since "user closed the checkout modal" is an ordinary,
 * expected outcome.
 */
export async function openRazorpayCheckout({ razorpayOrder, payment, userEmail, userName, description }) {
  await loadRazorpayScript();

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: razorpayOrder.keyId,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      order_id: razorpayOrder.id,
      name: 'FitLoom',
      description,
      prefill: { email: userEmail, name: userName },
      theme: { color: '#FF6B1F' },
      handler: async (response) => {
        try {
          const verified = await paymentApi.verify(payment._id, {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          resolve(verified);
        } catch (err) {
          reject(err);
        }
      },
      modal: {
        ondismiss: () => reject(new Error('Payment cancelled.')),
      },
    });

    rzp.on('payment.failed', (resp) => {
      reject(new Error(resp.error?.description || 'Payment failed. Please try again.'));
    });

    rzp.open();
  });
}