// server/config/pricing.js (NEW)
// Single source of truth for Verzo pricing. The live Pricing page and both
// Stripe flows read from here — never hardcode a price or credit amount
// anywhere else. Amounts are in cents (Stripe convention).
// Decided by Faizy 2026-11-25: the .99 packages win over the old
// Pro $10 = 100 / Enterprise $40 = 500 page values.

export const FREE_SIGNUP_CREDITS = 20;

export const CREDIT_PACKAGES = {
  starter: { id: 'starter', name: 'Starter', amount: 499, credits: 50 },
  growth: { id: 'growth', name: 'Growth', amount: 999, credits: 120, popular: true },
  pro: { id: 'pro', name: 'Pro', amount: 1999, credits: 300 },
};

export const formatPrice = (amountCents) => `$${(amountCents / 100).toFixed(2)}`;
