import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stripeSubscriptionId: { type: String, required: true },
  plan: { type: String, enum: ['basic', 'pro'], required: true },
  status: { type: String, enum: ['active', 'canceled', 'past_due'], default: 'active' },
  currentPeriodEnd: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Subscription', subscriptionSchema);
