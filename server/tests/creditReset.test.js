// server/tests/creditReset.test.js
// Tests the top-up-only daily free-credit reset with NO database: the same
// node:test + node:assert/strict pattern as server/tests/billingIntegrity.test.js.
// The fake model below emulates the MongoDB filter operators the reset
// relies on (equality, $lt, $ne, $exists, $or) and the $set update.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createCreditResetter } from '../utils/creditReset.js';
import { FREE_SIGNUP_CREDITS } from '../config/pricing.js';

// ── Minimal in-memory Mongoose stand-in ──────────────────────────────
const valueOf = (v) => (v instanceof Date ? v.getTime() : v);

const matchCondition = (val, cond) => {
  if (cond && typeof cond === 'object' && !(cond instanceof Date)) {
    if ('$lt' in cond) return val !== undefined && valueOf(val) < valueOf(cond.$lt);
    if ('$ne' in cond) return val !== cond.$ne;
    if ('$exists' in cond) return cond.$exists ? val !== undefined : val === undefined;
    return false;
  }
  return val === cond;
};

const matchDoc = (doc, filter) =>
  Object.entries(filter).every(([key, cond]) => {
    if (key === '$or') return cond.some((sub) => matchDoc(doc, sub));
    return matchCondition(doc[key], cond);
  });

const makeFakeUserModel = (seedDocs) => {
  const docs = new Map(seedDocs.map((d) => [d._id, { ...d }]));
  return {
    docs,
    updateMany: async (filter, update) => {
      let modifiedCount = 0;
      for (const doc of docs.values()) {
        if (!matchDoc(doc, filter)) continue;
        if (update.$set) for (const [k, v] of Object.entries(update.$set)) doc[k] = v;
        modifiedCount += 1;
      }
      return { modifiedCount };
    },
  };
};

const yesterday = () => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d;
};

const today = () => new Date();

describe('createCreditResetter — top-up only, never reduce', () => {
  it('tops up a free verified user below the allowance to 20', async () => {
    const User = makeFakeUserModel([
      { _id: 'u1', subscription: 'free', credits: 5, isEmailVerified: true, lastFreeCreditResetAt: yesterday() },
    ]);
    const { resetDailyFreeCredits } = createCreditResetter(User, FREE_SIGNUP_CREDITS);
    const count = await resetDailyFreeCredits();
    assert.equal(count, 1);
    assert.equal(User.docs.get('u1').credits, 20);
  });

  it('tops up a verified user holding 0 credits to 20', async () => {
    const User = makeFakeUserModel([
      { _id: 'u1', subscription: 'free', credits: 0, isEmailVerified: true, lastFreeCreditResetAt: yesterday() },
    ]);
    const { resetDailyFreeCredits } = createCreditResetter(User, FREE_SIGNUP_CREDITS);
    await resetDailyFreeCredits();
    assert.equal(User.docs.get('u1').credits, 20);
  });

  it('never reduces a user who bought credits (120 stays 120)', async () => {
    const User = makeFakeUserModel([
      { _id: 'u1', subscription: 'free', credits: 120, isEmailVerified: true, lastFreeCreditResetAt: yesterday() },
    ]);
    const { resetDailyFreeCredits } = createCreditResetter(User, FREE_SIGNUP_CREDITS);
    const count = await resetDailyFreeCredits();
    assert.equal(count, 0);
    assert.equal(User.docs.get('u1').credits, 120);
  });

  it('never reduces a user holding more than the allowance (25 stays 25)', async () => {
    const User = makeFakeUserModel([
      { _id: 'u1', subscription: 'free', credits: 25, isEmailVerified: true, lastFreeCreditResetAt: yesterday() },
    ]);
    const { resetDailyFreeCredits } = createCreditResetter(User, FREE_SIGNUP_CREDITS);
    const count = await resetDailyFreeCredits();
    assert.equal(count, 0);
    assert.equal(User.docs.get('u1').credits, 25);
  });

  it('never tops up an unverified account (0 stays 0)', async () => {
    const User = makeFakeUserModel([
      { _id: 'u1', subscription: 'free', credits: 0, isEmailVerified: false, lastFreeCreditResetAt: yesterday() },
    ]);
    const { resetDailyFreeCredits } = createCreditResetter(User, FREE_SIGNUP_CREDITS);
    const count = await resetDailyFreeCredits();
    assert.equal(count, 0);
    assert.equal(User.docs.get('u1').credits, 0);
  });

  it('never resets a paying user (basic/pro), even below the allowance', async () => {
    const User = makeFakeUserModel([
      { _id: 'u1', subscription: 'basic', credits: 5, isEmailVerified: true, lastFreeCreditResetAt: yesterday() },
      { _id: 'u2', subscription: 'pro', credits: 5, isEmailVerified: true, lastFreeCreditResetAt: yesterday() },
    ]);
    const { resetDailyFreeCredits } = createCreditResetter(User, FREE_SIGNUP_CREDITS);
    const count = await resetDailyFreeCredits();
    assert.equal(count, 0);
    assert.equal(User.docs.get('u1').credits, 5);
    assert.equal(User.docs.get('u2').credits, 5);
  });

  it('does not reset the same user twice in one day', async () => {
    const User = makeFakeUserModel([
      { _id: 'u1', subscription: 'free', credits: 5, isEmailVerified: true, lastFreeCreditResetAt: today() },
    ]);
    const { resetDailyFreeCredits } = createCreditResetter(User, FREE_SIGNUP_CREDITS);
    const count = await resetDailyFreeCredits();
    assert.equal(count, 0);
    assert.equal(User.docs.get('u1').credits, 5);
  });

  it('treats an account with no verification field (pre-verification) as verified', async () => {
    const User = makeFakeUserModel([
      // No isEmailVerified key at all — the 19 accounts created before
      // verification existed. $ne: false matches a missing field.
      { _id: 'u1', subscription: 'free', credits: 5, lastFreeCreditResetAt: yesterday() },
    ]);
    const { resetDailyFreeCredits } = createCreditResetter(User, FREE_SIGNUP_CREDITS);
    const count = await resetDailyFreeCredits();
    assert.equal(count, 1);
    assert.equal(User.docs.get('u1').credits, 20);
  });

  it('resets a user who has never been reset (no lastFreeCreditResetAt)', async () => {
    const User = makeFakeUserModel([
      { _id: 'u1', subscription: 'free', credits: 3, isEmailVerified: true },
    ]);
    const { resetDailyFreeCredits } = createCreditResetter(User, FREE_SIGNUP_CREDITS);
    const count = await resetDailyFreeCredits();
    assert.equal(count, 1);
    assert.equal(User.docs.get('u1').credits, 20);
    assert.ok(User.docs.get('u1').lastFreeCreditResetAt instanceof Date);
  });
});
