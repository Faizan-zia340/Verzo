import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  MAX_LOGIN_ATTEMPTS,
  LOCK_DURATION_MS,
  TWO_FACTOR_CODE_TTL_MS,
  isLocked,
  lockRetryAfterSeconds,
  recordFailedLogin,
  hashTwoFactorCode,
  isTwoFactorCodeValid,
} from '../utils/loginSecurity.js';
import { twoFactorVerifySchema, twoFactorToggleSchema } from '../utils/validators.js';

// A plain user-shaped object: the helpers are pure and take no database.
const freshUser = () => ({ loginAttempts: 0, lockUntil: undefined });

describe('login lockout — recordFailedLogin / isLocked', () => {
  it('counts failures without locking before the 5th attempt', () => {
    const user = freshUser();
    const now = Date.now();
    for (let i = 1; i < MAX_LOGIN_ATTEMPTS; i += 1) {
      assert.equal(recordFailedLogin(user, now), false);
      assert.equal(user.loginAttempts, i);
      assert.equal(isLocked(user, now), false);
    }
  });

  it('locks the account on the 5th failed attempt, 15 minutes ahead, and resets the counter', () => {
    const user = freshUser();
    const now = Date.now();
    let locked = false;
    for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i += 1) {
      locked = recordFailedLogin(user, now);
    }
    assert.equal(locked, true);
    assert.equal(user.loginAttempts, 0);
    assert.ok(user.lockUntil instanceof Date);
    const ahead = new Date(user.lockUntil).getTime() - now;
    assert.ok(ahead >= LOCK_DURATION_MS - 1000 && ahead <= LOCK_DURATION_MS + 1000);
    assert.equal(isLocked(user, now), true);
  });

  it('stays locked until the lock expires, then unlocks', () => {
    const user = freshUser();
    const now = Date.now();
    for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i += 1) recordFailedLogin(user, now);
    assert.equal(isLocked(user, now + LOCK_DURATION_MS - 1000), true);
    assert.equal(isLocked(user, now + LOCK_DURATION_MS + 1000), false);
  });

  it('reports whole seconds left until unlock', () => {
    const user = freshUser();
    const now = Date.now();
    for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i += 1) recordFailedLogin(user, now);
    const retryAfter = lockRetryAfterSeconds(user, now);
    assert.ok(retryAfter > 0 && retryAfter <= 900);
    assert.equal(lockRetryAfterSeconds(freshUser(), now), 0);
  });

  it('a user with no lock fields is never locked', () => {
    assert.equal(isLocked({}, Date.now()), false);
    assert.equal(isLocked(null, Date.now()), false);
  });
});

describe('two-step verification code — hashing and expiry', () => {
  const code = '482913';
  const userWithCode = (now) => ({
    twoFactorCode: hashTwoFactorCode(code),
    twoFactorExpires: new Date(now + TWO_FACTOR_CODE_TTL_MS),
  });

  it('stores the SHA-256 hash of the code, never the raw code', () => {
    const hash = hashTwoFactorCode(code);
    assert.equal(hash, crypto.createHash('sha256').update(code).digest('hex'));
    assert.notEqual(hash, code);
    assert.equal(hash.length, 64);
  });

  it('accepts the right code while it is live', () => {
    const now = Date.now();
    assert.equal(isTwoFactorCodeValid(userWithCode(now), code, now), true);
  });

  it('rejects a wrong code', () => {
    const now = Date.now();
    assert.equal(isTwoFactorCodeValid(userWithCode(now), '000000', now), false);
  });

  it('rejects a code past its 10-minute expiry', () => {
    const now = Date.now();
    const user = userWithCode(now);
    assert.equal(isTwoFactorCodeValid(user, code, now + TWO_FACTOR_CODE_TTL_MS + 1000), false);
  });

  it('rejects a missing code or a missing expiry', () => {
    const now = Date.now();
    assert.equal(isTwoFactorCodeValid({}, code, now), false);
    assert.equal(isTwoFactorCodeValid({ twoFactorCode: hashTwoFactorCode(code) }, code, now), false);
    assert.equal(isTwoFactorCodeValid({ twoFactorExpires: new Date(now + 60000) }, code, now), false);
  });
});

describe('twoFactorVerifySchema', () => {
  const valid = (overrides = {}) => ({ email: 'a@gmail.com', code: '482913', ...overrides });

  it('accepts a 6-digit code', () => {
    const { error } = twoFactorVerifySchema.validate(valid());
    assert.equal(error, undefined);
  });

  it('rejects a 5-digit code', () => {
    const { error } = twoFactorVerifySchema.validate(valid({ code: '48291' }));
    assert.ok(error);
    assert.match(error.message, /6 digits/);
  });

  it('rejects a code with letters', () => {
    const { error } = twoFactorVerifySchema.validate(valid({ code: '48291a' }));
    assert.ok(error);
  });

  it('rejects a missing code and a bad email', () => {
    assert.ok(twoFactorVerifySchema.validate({ email: 'a@gmail.com' }).error);
    assert.ok(twoFactorVerifySchema.validate(valid({ email: 'not-an-email' })).error);
  });
});

describe('twoFactorToggleSchema', () => {
  it('accepts enabled true and false', () => {
    assert.equal(twoFactorToggleSchema.validate({ enabled: true }).error, undefined);
    assert.equal(twoFactorToggleSchema.validate({ enabled: false }).error, undefined);
  });

  it('rejects a missing or non-boolean enabled', () => {
    assert.ok(twoFactorToggleSchema.validate({}).error);
    assert.ok(twoFactorToggleSchema.validate({ enabled: 'yes' }).error);
  });
});
