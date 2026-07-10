const buckets = new Map();

const WINDOW_MS = 60 * 60 * 1000;

const userRateLimit = (maxPerHour = 10) => (req, res, next) => {
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
      message: `Generation limit reached (${maxPerHour}/hour). Try again in ${Math.ceil(retryAfterSec / 60)} minute(s).`,
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

export default userRateLimit;
