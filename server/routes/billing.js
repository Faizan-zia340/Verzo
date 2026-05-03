import { Router } from 'express';
import protect from '../middleware/auth.js';
import stripe from '../config/stripe.js';
import User from '../models/User.js';
import Credit from '../models/Credit.js';
import Payment from '../models/Payment.js';

const router = Router();

const PLANS = {
  pro: { amount: 1000, credits: 100, label: 'Pro — 100 Credits' },
  enterprise: { amount: 4000, credits: 500, label: 'Enterprise — 500 Credits' },
};

router.post('/checkout', protect, async (req, res, next) => {
  try {
    const { planId } = req.body;
    const plan = PLANS[planId];
    if (!plan) return res.status(400).json({ message: 'Invalid plan' });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: plan.amount,
            product_data: { name: plan.label },
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

    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
});

router.post('/webhook', async (req, res, next) => {
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
    const { userId, credits } = session.metadata;
    const amount = session.amount_total;

    await Promise.all([
      User.findByIdAndUpdate(userId, { $inc: { credits: parseInt(credits) } }),
      Credit.create({
        user: userId,
        amount: parseInt(credits),
        type: 'purchase',
        description: `Stripe checkout — ${credits} credits purchased`,
      }),
      Payment.create({
        user: userId,
        stripePaymentIntentId: session.payment_intent || session.id,
        amount,
        status: 'succeeded',
        creditsAdded: parseInt(credits),
      }),
    ]);
  }

  res.json({ received: true });
});

export default router;
