import stripe from '../config/stripe.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import Credit from '../models/Credit.js';
import asyncHandler from '../utils/asyncHandler.js';
import logger from '../utils/logger.js';
import { CREDIT_PACKAGES, SUBSCRIPTION_FOR_PACKAGE } from '../config/pricing.js';
import { claimPaymentIntent } from '../utils/webhookIdempotency.js';

export const createPaymentIntent = asyncHandler(async (req, res) => {
  const { packageId } = req.body;
  const pkg = CREDIT_PACKAGES[packageId];
  if (!pkg) return res.status(400).json({ message: 'Invalid package' });

  const paymentIntent = await stripe.paymentIntents.create({
    amount: pkg.amount,
    currency: 'usd',
    metadata: { userId: req.user._id.toString(), credits: pkg.credits, packageId },
  });

  await Payment.create({ user: req.user._id, stripePaymentIntentId: paymentIntent.id, amount: pkg.amount, creditsAdded: pkg.credits });

  res.status(201).json({ clientSecret: paymentIntent.client_secret });
});

export const webhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    if (err.type === 'StripeSignatureVerificationError') {
      return res.status(400).json({ message: `Webhook error: ${err.message}` });
    }
    throw err;
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    const { userId, credits, packageId } = pi.metadata || {};
    const amount = parseInt(credits, 10);
    if (!userId || !Number.isFinite(amount) || amount <= 0) {
      logger.warn({ pi: pi.id }, 'payment_intent.succeeded without usable metadata; skipping credit');
      return res.status(200).json({ received: true });
    }

    // Idempotency (H3): only the first delivery credits. The conditional
    // update flips pending -> succeeded atomically; a redelivery finds it
    // already 'succeeded' and skips the credit.
    const { claimed, payment } = await claimPaymentIntent(Payment, pi.id);
    if (!claimed && payment) return res.status(200).json({ received: true }); // duplicate delivery
    if (!claimed && !payment) {
      // No Payment row (intent created outside our checkout) — create it once.
      // The unique index on stripePaymentIntentId guards the race; 11000 means
      // another delivery just created it.
      try {
        await Payment.create({
          user: userId,
          stripePaymentIntentId: pi.id,
          amount: pi.amount,
          creditsAdded: amount,
          status: 'succeeded',
        });
      } catch (err) {
        if (err.code === 11000) return res.status(200).json({ received: true });
        throw err;
      }
    }

    // A purchase moves the buyer off the `free` tier (see
    // SUBSCRIPTION_FOR_PACKAGE). Unknown package ids leave the tier
    // untouched — the credits still land.
    const tier = SUBSCRIPTION_FOR_PACKAGE[packageId];
    const userUpdate = { $inc: { credits: amount } };
    if (tier) userUpdate.$set = { subscription: tier };

    await Promise.all([
      User.findByIdAndUpdate(userId, userUpdate),
      Credit.create({ user: userId, amount, type: 'purchase', description: 'Credit purchase' }),
    ]);
  }

  return res.status(200).json({ received: true });
});

export const getPaymentHistory = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json(payments);
});
