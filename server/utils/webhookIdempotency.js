// server/utils/webhookIdempotency.js (NEW)
// Stripe redelivers webhooks (retries, at-least-once delivery). Without a
// guard, a redelivered success event credits the user twice (H3).
// Both helpers below are atomic single-document operations: the FIRST
// delivery wins, every later one is a no-op.

// PaymentIntents webhook: the Payment row is created at checkout time with
// status 'pending', so the first delivery atomically flips it to 'succeeded'.
// Returns { claimed, payment }. claimed === false with a payment means this
// intent was already processed (duplicate delivery — do not credit).
// claimed === false with payment === null means no row exists (intent created
// outside our checkout) — the caller creates it once; a unique index on
// Payment.stripePaymentIntentId guards that race (duplicate key 11000 = duplicate).
export const claimPaymentIntent = async (PaymentModel, stripePaymentIntentId) => {
  const claimed = await PaymentModel.findOneAndUpdate(
    { stripePaymentIntentId, status: { $ne: 'succeeded' } },
    { $set: { status: 'succeeded' } },
    { new: true },
  );
  if (claimed) return { claimed: true, payment: claimed };
  const existing = await PaymentModel.findOne({ stripePaymentIntentId });
  return { claimed: false, payment: existing };
};

// Checkout webhook: no Payment row exists before the event, so the claim is
// an upsert that only inserts once. updatedExisting === true means this
// session was already processed (duplicate delivery — do not credit).
// `doc` is the Payment row to insert on first delivery.
export const claimCheckoutSession = async (PaymentModel, stripePaymentIntentId, doc) => {
  const res = await PaymentModel.findOneAndUpdate(
    { stripePaymentIntentId },
    { $setOnInsert: doc },
    { upsert: true, new: true, includeResultMetadata: true },
  );
  return {
    claimed: res.lastErrorObject?.updatedExisting === false,
    payment: res.value,
  };
};
