// server/tests/billingIntegrity.test.js (NEW)
// Tests the billing-integrity fixes with NO database: the same node:test +
// node:assert/strict pattern as server/tests/adminDeleteUser.test.js.
// The fake model below faithfully emulates MongoDB single-document atomic
// `findOneAndUpdate` semantics: the match + mutate happens synchronously
// inside one call (no await in between), exactly like the server-side atomic
// update — so two concurrent reserves genuinely race, and only one can win.
// What these tests do NOT cover (see PR description): live MongoDB
// concurrency, and the webhook handler wiring (importing the controller needs
// a Stripe key). Those are verified by code review + `node --check`.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createCreditStore } from '../utils/credits.js';
import { claimPaymentIntent, claimCheckoutSession } from '../utils/webhookIdempotency.js';
import { CREDIT_PACKAGES, FREE_SIGNUP_CREDITS } from '../config/pricing.js';

// ── Minimal in-memory Mongoose stand-in ──────────────────────────────
// Supports: equality, $gte, $ne in filters; $inc, $set, $setOnInsert;
// upsert + includeResultMetadata ({ value, lastErrorObject.updatedExisting });
// create() with a simulated unique index on stripePaymentIntentId (11000).
const matchDoc = (doc, filter) =>
  Object.entries(filter).every(([key, cond]) => {
    const val = doc[key];
    if (cond && typeof cond === 'object') {
      if ('$gte' in cond) return typeof val === 'number' && val >= cond.$gte;
      if ('$ne' in cond) return val !== cond.$ne;
      return false;
    }
    return val === cond;
  });

const applyUpdate = (doc, update, isInsert) => {
  if (update.$inc) for (const [k, v] of Object.entries(update.$inc)) doc[k] = (doc[k] ?? 0) + v;
  if (update.$set) for (const [k, v] of Object.entries(update.$set)) doc[k] = v;
  if (isInsert && update.$setOnInsert) for (const [k, v] of Object.entries(update.$setOnInsert)) doc[k] = v;
};

const makeFakeModel = ({ uniqueKey = null } = {}) => {
  const docs = new Map(); // _id -> doc
  let seq = 0;
  const clone = (d) => (d ? JSON.parse(JSON.stringify(d)) : d);

  const findOneAndUpdate = (filter, update, options = {}) => {
    const found = [...docs.values()].find((d) => matchDoc(d, filter));
    if (found) {
      applyUpdate(found, update, false);
      const value = clone(found);
      return options.includeResultMetadata
        ? { value, lastErrorObject: { n: 1, updatedExisting: true } }
        : value;
    }
    if (!options.upsert) {
      return options.includeResultMetadata
        ? { value: null, lastErrorObject: { n: 0, updatedExisting: false } }
        : null;
    }
    const _id = `fake_${++seq}`;
    const doc = { _id };
    for (const [k, v] of Object.entries(filter)) if (typeof v !== 'object') doc[k] = v;
    applyUpdate(doc, update, true);
    docs.set(_id, doc);
    const value = clone(doc);
    return options.includeResultMetadata
      ? { value, lastErrorObject: { n: 1, updatedExisting: false, upserted: _id } }
      : value;
  };

  return {
    _docs: docs,
    findOne: (filter) => {
      const found = [...docs.values()].find((d) => matchDoc(d, filter));
      return found ? clone(found) : null;
    },
    findOneAndUpdate: (filter, update, options) =>
      Promise.resolve(findOneAndUpdate(filter, update, options)),
    findByIdAndUpdate: (id, update, options) =>
      Promise.resolve(findOneAndUpdate({ _id: id }, update, options)),
    create: (doc) => {
      if (uniqueKey && [...docs.values()].some((d) => d[uniqueKey] === doc[uniqueKey])) {
        const err = new Error(`E11000 duplicate key error on ${uniqueKey}`);
        err.code = 11000;
        throw err;
      }
      const _id = doc._id || `fake_${++seq}`;
      docs.set(_id, { ...doc, _id });
      return Promise.resolve(clone(docs.get(_id)));
    },
  };
};

const userId = 'user_1';

// ── Credit reserve / refund ──────────────────────────────────────────
describe('credit reserve (atomic, concurrent)', () => {
  it('1 credit, 2 concurrent requests -> exactly one passes', async () => {
    const Users = makeFakeModel();
    await Users.create({ _id: userId, credits: 1 });
    const store = createCreditStore(Users);
    const [first, second] = await Promise.all([
      store.reserve(userId, 1),
      store.reserve(userId, 1),
    ]);
    const winners = [first, second].filter(Boolean);
    assert.equal(winners.length, 1);
    assert.equal((await Users.findOne({ _id: userId })).credits, 0);
  });

  it('0 credits -> reserve returns null (402 case)', async () => {
    const Users = makeFakeModel();
    await Users.create({ _id: userId, credits: 0 });
    const store = createCreditStore(Users);
    assert.equal(await store.reserve(userId, 1), null);
    assert.equal((await Users.findOne({ _id: userId })).credits, 0);
  });

  it('reserve amount 2 with balance 1 -> null, balance untouched', async () => {
    const Users = makeFakeModel();
    await Users.create({ _id: userId, credits: 1 });
    const store = createCreditStore(Users);
    assert.equal(await store.reserve(userId, 2), null);
    assert.equal((await Users.findOne({ _id: userId })).credits, 1);
  });

  it('refund after a failed generation restores the credit', async () => {
    const Users = makeFakeModel();
    await Users.create({ _id: userId, credits: 5 });
    const store = createCreditStore(Users);
    const reserved = await store.reserve(userId, 1);
    assert.equal(reserved.credits, 4);
    await store.refund(userId, 1);
    assert.equal((await Users.findOne({ _id: userId })).credits, 5);
  });
});

// ── Webhook idempotency ──────────────────────────────────────────────
describe('webhook idempotency', () => {
  const piId = 'pi_test_123';

  it('PaymentIntents: first delivery claims, redelivery does not', async () => {
    const Payments = makeFakeModel({ uniqueKey: 'stripePaymentIntentId' });
    await Payments.create({ stripePaymentIntentId: piId, status: 'pending', creditsAdded: 50 });
    const first = await claimPaymentIntent(Payments, piId);
    assert.equal(first.claimed, true);
    assert.equal(first.payment.status, 'succeeded');
    const second = await claimPaymentIntent(Payments, piId);
    assert.equal(second.claimed, false);
    assert.equal(second.payment.status, 'succeeded');
  });

  it('PaymentIntents: two concurrent deliveries -> exactly one claim', async () => {
    const Payments = makeFakeModel({ uniqueKey: 'stripePaymentIntentId' });
    await Payments.create({ stripePaymentIntentId: piId, status: 'pending', creditsAdded: 50 });
    const [a, b] = await Promise.all([
      claimPaymentIntent(Payments, piId),
      claimPaymentIntent(Payments, piId),
    ]);
    assert.equal([a, b].filter((r) => r.claimed).length, 1);
  });

  it('PaymentIntents: already-succeeded row -> not claimed', async () => {
    const Payments = makeFakeModel({ uniqueKey: 'stripePaymentIntentId' });
    await Payments.create({ stripePaymentIntentId: piId, status: 'succeeded', creditsAdded: 50 });
    const res = await claimPaymentIntent(Payments, piId);
    assert.equal(res.claimed, false);
  });

  it('PaymentIntents: no row -> claimed false + null (caller creates once)', async () => {
    const Payments = makeFakeModel({ uniqueKey: 'stripePaymentIntentId' });
    const res = await claimPaymentIntent(Payments, piId);
    assert.equal(res.claimed, false);
    assert.equal(res.payment, null);
    await Payments.create({ stripePaymentIntentId: piId, status: 'succeeded', creditsAdded: 50 });
    // A racing duplicate create must fail with 11000 so the caller skips crediting.
    await assert.rejects(
      async () => {
        await Payments.create({ stripePaymentIntentId: piId, status: 'succeeded', creditsAdded: 50 });
      },
      (err) => err.code === 11000
    );
  });

  it('Checkout: first delivery inserts + claims, redelivery does not', async () => {
    const Payments = makeFakeModel({ uniqueKey: 'stripePaymentIntentId' });
    const doc = { user: userId, stripePaymentIntentId: 'cs_test_1', amount: 999, status: 'succeeded', creditsAdded: 120 };
    const first = await claimCheckoutSession(Payments, 'cs_test_1', doc);
    assert.equal(first.claimed, true);
    const second = await claimCheckoutSession(Payments, 'cs_test_1', doc);
    assert.equal(second.claimed, false);
    assert.equal([...Payments._docs.values()].filter((d) => d.stripePaymentIntentId === 'cs_test_1').length, 1);
  });

  it('Checkout: two concurrent deliveries -> exactly one claim, one row', async () => {
    const Payments = makeFakeModel({ uniqueKey: 'stripePaymentIntentId' });
    const doc = { user: userId, stripePaymentIntentId: 'cs_test_2', amount: 499, status: 'succeeded', creditsAdded: 50 };
    const [a, b] = await Promise.all([
      claimCheckoutSession(Payments, 'cs_test_2', doc),
      claimCheckoutSession(Payments, 'cs_test_2', doc),
    ]);
    assert.equal([a, b].filter((r) => r.claimed).length, 1);
    assert.equal([...Payments._docs.values()].filter((d) => d.stripePaymentIntentId === 'cs_test_2').length, 1);
  });
});

// ── Pricing config ───────────────────────────────────────────────────
describe('pricing single source of truth', () => {
  it('free signup credits are 20', () => {
    assert.equal(FREE_SIGNUP_CREDITS, 20);
  });

  it('packages are the .99 tiers Faizy chose', () => {
    assert.deepEqual(
      Object.values(CREDIT_PACKAGES).map((p) => [p.id, p.amount, p.credits]),
      [
        ['starter', 499, 50],
        ['growth', 999, 120],
        ['pro', 1999, 300],
      ]
    );
  });
});
