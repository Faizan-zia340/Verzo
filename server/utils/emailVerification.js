// server/utils/emailVerification.js
// Email-verification helpers (pure, no database, no mail service).
//
// The flow mirrors forgot-password: a random token is issued, only its
// SHA-256 hash is stored, and the raw token travels in the email link.
// The signup credits are granted here — and only here — so the grant rule
// is testable without a database (see server/tests/emailVerification.test.js).
import crypto from 'crypto';
import { FREE_SIGNUP_CREDITS } from '../config/pricing.js';

// Issues a fresh verification token. Returns the raw token (for the email
// link), its SHA-256 hash (for storage), and the expiry (24 hours).
export const createVerificationToken = () => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  return {
    rawToken,
    tokenHash: crypto.createHash('sha256').update(rawToken).digest('hex'),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
};

// Applies a successful verification to a user object (plain object or
// Mongoose document — only plain property writes, no database call).
// Marks the account verified, clears the token, and grants the signup
// credits as a TOP-UP to the free allowance: an account holding less than
// the allowance is raised to it, and an account holding more is never
// reduced. Returns the user. Idempotent — verifying an already-verified
// account changes nothing.
export const applyVerificationGrant = (user, freeCredits = FREE_SIGNUP_CREDITS) => {
  if (user.isEmailVerified !== false) return user;
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  if (user.credits < freeCredits) user.credits = freeCredits;
  return user;
};
