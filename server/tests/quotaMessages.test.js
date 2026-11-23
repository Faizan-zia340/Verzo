import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mapProviderError,
  sanitizeUserMessage,
  verzoBusyMessage,
  parseRetryAfterSec,
  containsProviderName,
} from '../utils/quotaMessages.js';
import userRateLimit from '../middleware/userRateLimit.js';

const PROVIDER_WORDS = ['gemini', 'google', 'openai', 'gpt', 'claude', 'llama'];
const assertNoProviderName = (text) => {
  for (const w of PROVIDER_WORDS) assert.ok(!text.toLowerCase().includes(w), `leaked provider word "${w}" in: ${text}`);
  assert.ok(text.includes('Verzo'), `message is not Verzo-branded: ${text}`);
};

// ── Provider-error mapping ─────────────────────────────────────────
test('quota error maps to Verzo-branded 429 with wait time, no provider name', () => {
  const mapped = mapProviderError(new Error('RESOURCE_EXHAUSTED: Quota exceeded for quota metric. Please retry in 42.3s'));
  assert.equal(mapped.status, 429);
  assert.equal(mapped.retryAfter, 43);
  assert.ok(mapped.message.startsWith('Verzo is busy right now'));
  assert.ok(mapped.message.includes('43 second(s)'));
  assertNoProviderName(mapped.message);
});

test('plain 429 status maps to Verzo-branded 429', () => {
  const err = new Error('Too many requests');
  err.statusCode = 429;
  const mapped = mapProviderError(err);
  assert.equal(mapped.status, 429);
  assertNoProviderName(mapped.message);
});

test('invalid API key maps to Verzo-branded 503, never mentions the key', () => {
  const mapped = mapProviderError(new Error('API_KEY_INVALID: API key not valid. Please pass a valid API key.'));
  assert.equal(mapped.status, 503);
  assert.equal(mapped.message, 'Verzo’s AI service is temporarily unavailable. Please try again shortly.');
  assertNoProviderName(mapped.message);
});

test('overloaded provider maps to Verzo-branded 503', () => {
  const mapped = mapProviderError(new Error('The model is overloaded. Please try again later.'));
  assert.equal(mapped.status, 503);
  assertNoProviderName(mapped.message);
});

test('unknown provider error maps to a generic Verzo 500', () => {
  const mapped = mapProviderError(new Error('Some weird internal failure'));
  assert.equal(mapped.status, 500);
  assertNoProviderName(mapped.message);
});

test('retry delay is parsed from Google-style error details', () => {
  const err = new Error('RESOURCE_EXHAUSTED');
  err.details = [{ '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '30s' }];
  assert.equal(parseRetryAfterSec(err), 30);
  assert.equal(parseRetryAfterSec(new Error('nothing here')), null);
});

// ── Message helpers ────────────────────────────────────────────────
test('verzoBusyMessage formats the wait time', () => {
  assert.equal(verzoBusyMessage(3600), 'Verzo is busy right now — please try again in 60 minute(s).');
  assert.equal(verzoBusyMessage(45), 'Verzo is busy right now — please try again in 45 second(s).');
  assert.equal(verzoBusyMessage(null), 'Verzo is busy right now — please try again in a few minutes.');
});

test('containsProviderName only flags real provider names', () => {
  assert.equal(containsProviderName('Gemini quota reached'), true);
  assert.equal(containsProviderName('Verzo is busy right now'), false);
});

// ── Error-handler safety net ───────────────────────────────────────
test('sanitizeUserMessage strips provider names from any error', () => {
  assert.equal(
    sanitizeUserMessage(500, 'Gemini free tier quota reached', null),
    'Verzo could not complete that right now. Please try again shortly.'
  );
  assert.equal(
    sanitizeUserMessage(503, 'Gemini is temporarily overloaded', null),
    'Verzo’s AI service is temporarily unavailable. Please try again shortly.'
  );
  assert.equal(
    sanitizeUserMessage(429, 'anything', 120),
    'Verzo is busy right now — please try again in 2 minute(s).'
  );
  assert.equal(sanitizeUserMessage(400, 'text and action are required', null), 'text and action are required');
});

// ── Per-user rate limiting ─────────────────────────────────────────
const mockRes = () => {
  const res = { headers: {}, statusCode: null, body: null, set(k, v) { this.headers[k] = v; }, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } };
  return res;
};

test('each user gets their own hourly bucket; the 11th request is a Verzo 429', () => {
  const limit = userRateLimit(10);
  const user = { _id: 'user-quota-a' };
  for (let i = 0; i < 10; i++) {
    let nextCalled = false;
    limit({ user }, mockRes(), () => { nextCalled = true; });
    assert.equal(nextCalled, true, `request ${i + 1} should pass`);
  }
  const res = mockRes();
  let nextCalled = false;
  limit({ user }, res, () => { nextCalled = true; });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 429);
  assert.ok(res.headers['Retry-After']);
  assert.equal(typeof res.body.retryAfter, 'number');
  assert.ok(res.body.message.startsWith('Verzo is busy right now'));
  assertNoProviderName(res.body.message);
});

test('one user hitting the limit does not block another user', () => {
  const limit = userRateLimit(1);
  const heavy = { _id: 'user-quota-heavy' };
  const other = { _id: 'user-quota-other' };
  let nextCalled = false;
  limit({ user: heavy }, mockRes(), () => { nextCalled = true; });
  assert.equal(nextCalled, true);
  const res = mockRes();
  limit({ user: heavy }, res, () => {});
  assert.equal(res.statusCode, 429);

  nextCalled = false;
  limit({ user: other }, mockRes(), () => { nextCalled = true; });
  assert.equal(nextCalled, true, 'a different user must still pass');
});

test('unauthenticated requests pass through the per-user limiter', () => {
  const limit = userRateLimit(10);
  let nextCalled = false;
  limit({}, mockRes(), () => { nextCalled = true; });
  assert.equal(nextCalled, true);
});
