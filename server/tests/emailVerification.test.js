// server/tests/emailVerification.test.js
// Tests the email-verification helpers (pure, no database, no mail service).
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createVerificationToken, applyVerificationGrant } from '../utils/emailVerification.js';
import { FREE_SIGNUP_CREDITS } from '../config/pricing.js';

describe('createVerificationToken', () => {
  it('returns a raw token, its SHA-256 hash, and a 24h expiry', () => {
    const before = Date.now();
    const { rawToken, tokenHash, expiresAt } = createVerificationToken();
    assert.equal(typeof rawToken, 'string');
    assert.ok(rawToken.length >= 32);
    assert.equal(tokenHash, crypto.createHash('sha256').update(rawToken).digest('hex'));
    assert.ok(expiresAt instanceof Date);
    // Expiry is 24h after the token was issued (a hair more than 24h
    // measured from just before the call, since the clock moves on).
    const ttlMs = expiresAt.getTime() - before;
    assert.ok(ttlMs >= 24 * 60 * 60 * 1000 && ttlMs <= 24 * 60 * 60 * 1000 + 5000);
  });

  it('issues a different token each time', () => {
    const a = createVerificationToken();
    const b = createVerificationToken();
    assert.notEqual(a.rawToken, b.rawToken);
    assert.notEqual(a.tokenHash, b.tokenHash);
  });
});

describe('applyVerificationGrant', () => {
  it('verifies an unverified account and grants the 20 signup credits', () => {
    const user = {
      isEmailVerified: false, credits: 0,
      emailVerificationToken: 'hash', emailVerificationExpires: new Date(),
    };
    const out = applyVerificationGrant(user);
    assert.equal(out.isEmailVerified, true);
    assert.equal(out.emailVerificationToken, undefined);
    assert.equal(out.emailVerificationExpires, undefined);
    assert.equal(out.credits, FREE_SIGNUP_CREDITS);
  });

  it('tops up an unverified account holding some credits to the allowance', () => {
    const user = { isEmailVerified: false, credits: 5 };
    applyVerificationGrant(user);
    assert.equal(user.credits, FREE_SIGNUP_CREDITS);
  });

  it('never reduces an account holding more than the allowance', () => {
    const user = { isEmailVerified: false, credits: 120 };
    applyVerificationGrant(user);
    assert.equal(user.isEmailVerified, true);
    assert.equal(user.credits, 120);
  });

  it('is idempotent — verifying an already-verified account changes nothing', () => {
    const user = { isEmailVerified: true, credits: 7, emailVerificationToken: 'hash' };
    const out = applyVerificationGrant(user);
    assert.equal(out.isEmailVerified, true);
    assert.equal(out.credits, 7);
    assert.equal(out.emailVerificationToken, 'hash');
  });

  it('treats a missing verification flag (pre-verification account) as verified', () => {
    const user = { credits: 20 };
    const out = applyVerificationGrant(user);
    assert.equal(out.credits, 20);
  });
});
