import rateLimit from 'express-rate-limit';
import { penlixBusyMessage } from '../utils/quotaMessages.js';

const buckets = new Map();

const WINDOW_MS = 60 * 60 * 1000;

// Per-user hourly limit: every user gets their OWN bucket keyed by user id,
// so one heavy user can never exhaust the quota for everyone else.
// Unauthenticated requests (no req.user) pass through — routes that use
// this middleware must also use `protect` for the limit to apply.
const userRateLimit = (maxPerHour = 10, label = 'Generation') => (req, res, next) => {
  const userId = req.user?.id || req.user?._id?.toString();
  if (!userId) return next();

  const now = Date.now();
  const bucket = buckets.get(userId);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  if (bucket.count >= maxPerHour) {
    const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
    res.set('Retry-After', String(retryAfterSec));
    return res.status(429).json({
      message: penlixBusyMessage(retryAfterSec),
      retryAfter: retryAfterSec,
    });
  }

  bucket.count += 1;
  next();
};

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}, 10 * 60 * 1000).unref();

// Dedicated 5/hour limiter for forgot-password and resend-verification —
// separate from the global /api limiter, so a burst here never blocks
// sign-in or generation. Keyed by IP + the target email, so one address
// never blocks another and one IP cannot hammer many addresses for free.
export const authEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  keyGenerator: (req) => {
    const email = req.user?.email
      || (typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '');
    return email ? `${req.ip}:${email}` : req.ip;
  },
  handler: (req, res) => {
    res.set('Retry-After', '3600');
    res.status(429).json({ message: 'Too many requests. Please try again in an hour.', retryAfter: 3600 });
  },
});

export default userRateLimit;
