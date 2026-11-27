import crypto from 'crypto';

// Login lockout + email-OTP two-factor helpers. Pure functions on plain
// user-shaped objects ({ loginAttempts, lockUntil, twoFactorCode,
// twoFactorExpires }) so they are unit-testable without a database; the
// auth controller calls them with the Mongoose user document.
//
// Rules:
//   - 5 failed sign-in attempts lock the account for 15 minutes. The
//     counter resets when the lock is set, so a fresh 5 attempts are
//     needed to lock it again after the lock expires.
//   - A sign-in code is 6 digits, valid for 10 minutes, and only its
//     SHA-256 hash is ever stored, never the raw code.
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCK_DURATION_MS = 15 * 60 * 1000;
export const TWO_FACTOR_CODE_TTL_MS = 10 * 60 * 1000;

// True when the account is locked at `nowMs` (defaults to now).
export const isLocked = (user, nowMs = Date.now()) => {
  if (!user || !user.lockUntil) return false;
  return new Date(user.lockUntil).getTime() > nowMs;
};

// Whole seconds until the lock lifts (0 when not locked). Used for the
// 423 response's `retryAfter` so the client can say how long to wait.
export const lockRetryAfterSeconds = (user, nowMs = Date.now()) => {
  if (!user || !user.lockUntil) return 0;
  return Math.max(0, Math.ceil((new Date(user.lockUntil).getTime() - nowMs) / 1000));
};

// Record one failed sign-in. Returns true when this attempt just locked
// the account (the 5th failure); the caller saves the user either way.
export const recordFailedLogin = (user, nowMs = Date.now()) => {
  user.loginAttempts = (user.loginAttempts || 0) + 1;
  if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
    user.lockUntil = new Date(nowMs + LOCK_DURATION_MS);
    user.loginAttempts = 0;
    return true;
  }
  return false;
};

// SHA-256 hex of a sign-in code. Only this hash is stored on the user.
export const hashTwoFactorCode = (code) =>
  crypto.createHash('sha256').update(String(code)).digest('hex');

// True when the user holds a live code and `code` matches it. The
// comparison is timing-safe; a missing or expired code is never valid.
export const isTwoFactorCodeValid = (user, code, nowMs = Date.now()) => {
  if (!user || !user.twoFactorCode || !user.twoFactorExpires) return false;
  if (new Date(user.twoFactorExpires).getTime() <= nowMs) return false;
  const supplied = Buffer.from(hashTwoFactorCode(code), 'utf8');
  const stored = Buffer.from(String(user.twoFactorCode), 'utf8');
  if (stored.length !== supplied.length) return false;
  return crypto.timingSafeEqual(stored, supplied);
};
