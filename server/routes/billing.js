import { Router } from 'express';
import protect from '../middleware/auth.js';
import stripe from '../config/stripe.js';
import User from '../models/User.js';
import Credit from '../models/Credit.js';
import Payment from '../models/Payment.js';
import asyncHandler from '../utils/asyncHandler.js';
import logger from '../utils/logger.js';
import { CREDIT_PACKAGES, FREE_SIGNUP_CREDITS } from '../config/pricing.js';
import { claimCheckoutSession } from '../utils/webhookIdempotency.js';

const router = Router();

router.post('/checkout', protect, asyncHandler(async (req, res) => {
  const { planId } = req.body;
  const plan = CREDIT_PACKAGES[planId];
  if (!plan) return res.status(400).json({ message: 'Invalid plan' });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: plan.amount,
          product_data: { name: `${plan.name} — ${plan.credits} Credits` },
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/pricing`,
    metadata: {
      userId: req.user._id.toString(),
      credits: plan.credits.toString(),
      planId,
    },
  });

  res.status(201).json({ url: session.url });
}));

router.post('/webhook', asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).json({ message: `Webhook error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, credits } = session.metadata || {};
    const amount = parseInt(credits, 10);
    if (!userId || !Number.isFinite(amount) || amount <= 0) {
      logger.warn({ session: session.id }, 'checkout.session.completed without usable metadata; skipping credit');
      return res.status(200).json({ received: true });
    }

    // Idempotency (H3): the upsert inserts the Payment row only once.
    // A redelivery finds it already there and must not credit again.
    const { claimed } = await claimCheckoutSession(
      Payment,
      session.payment_intent || session.id,
      {
        user: userId,
        stripePaymentIntentId: session.payment_intent || session.id,
        amount: session.amount_total,
        status: 'succeeded',
        creditsAdded: amount,
      }
    );
    if (!claimed) return res.status(200).json({ received: true }); // duplicate delivery

    await Promise.all([
      User.findByIdAndUpdate(userId, { $inc: { credits: amount } }),
      Credit.create({
        user: userId,
        amount,
        type: 'purchase',
        description: `Stripe checkout — ${amount} credits purchased`,
      }),
    ]);
  }

  res.status(200).json({ received: true });
}));

// Public: the Pricing page reads its plans from here so the page can never
// disagree with the checkout code again. No auth — prices are public.
router.get('/packages', asyncHandler(async (req, res) => {
  res.status(200).json({
    freeCredits: FREE_SIGNUP_CREDITS,
    packages: Object.values(CREDIT_PACKAGES),
  });
}));

export default router;
