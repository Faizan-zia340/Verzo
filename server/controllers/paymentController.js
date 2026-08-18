import stripe from '../config/stripe.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import Credit from '../models/Credit.js';
import asyncHandler from '../utils/asyncHandler.js';

const CREDIT_PACKAGES = {
  starter: { amount: 499, credits: 50 },
  growth: { amount: 999, credits: 120 },
  pro: { amount: 1999, credits: 300 },
};

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
    const { userId, credits } = event.data.object.metadata;
    await Promise.all([
      User.findByIdAndUpdate(userId, { $inc: { credits: parseInt(credits) } }),
      Payment.findOneAndUpdate({ stripePaymentIntentId: event.data.object.id }, { status: 'succeeded' }),
      Credit.create({ user: userId, amount: parseInt(credits), type: 'purchase', description: 'Credit purchase' }),
    ]);
  }

  res.status(200).json({ received: true });
});

export const getPaymentHistory = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json(payments);
});
