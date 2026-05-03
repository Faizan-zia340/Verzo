import stripe from '../config/stripe.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import Credit from '../models/Credit.js';

const CREDIT_PACKAGES = {
  starter: { amount: 499, credits: 50 },
  growth: { amount: 999, credits: 120 },
  pro: { amount: 1999, credits: 300 },
};

export const createPaymentIntent = async (req, res, next) => {
  try {
    const { packageId } = req.body;
    const pkg = CREDIT_PACKAGES[packageId];
    if (!pkg) return res.status(400).json({ message: 'Invalid package' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: pkg.amount,
      currency: 'usd',
      metadata: { userId: req.user._id.toString(), credits: pkg.credits, packageId },
    });

    await Payment.create({ user: req.user._id, stripePaymentIntentId: paymentIntent.id, amount: pkg.amount, creditsAdded: pkg.credits });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    next(err);
  }
};

export const webhook = async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    if (event.type === 'payment_intent.succeeded') {
      const { userId, credits } = event.data.object.metadata;
      await Promise.all([
        User.findByIdAndUpdate(userId, { $inc: { credits: parseInt(credits) } }),
        Payment.findOneAndUpdate({ stripePaymentIntentId: event.data.object.id }, { status: 'succeeded' }),
        Credit.create({ user: userId, amount: parseInt(credits), type: 'purchase', description: 'Credit purchase' }),
      ]);
    }

    res.json({ received: true });
  } catch (err) {
    next(err);
  }
};

export const getPaymentHistory = async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    next(err);
  }
};
