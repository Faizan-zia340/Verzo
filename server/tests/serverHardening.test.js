// server/tests/serverHardening.test.js
// Batch B (server hardening): JWT invalidation on password reset, history
// caps, /rag validation, admin credit bounds, glossary persistence.
// Pure helpers + schema checks — no database, no mail service.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { isTokenStale } from '../middleware/auth.js';
import User from '../models/User.js';
import { ragSchema } from '../utils/validators.js';
import { clampHistoryLimit, MAX_HISTORY_LIMIT, EXPORT_LIMIT } from '../routes/history.js';
import { validateCreditAdjustment } from '../routes/admin.js';
import { persistApprovedTerm, GLOSSARY_PATH } from '../routes/glossary.js';
import { authEmailLimiter } from '../middleware/userRateLimit.js';

describe('password reset invalidates JWTs — isTokenStale', () => {
  const issuedAt = 1793000000; // token iat, seconds
  it('rejects a token issued before the password change', () => {
    const user = { passwordChangedAt: new Date(issuedAt * 1000 + 60_000) };
    assert.equal(isTokenStale({ iat: issuedAt }, user), true);
  });

  it('accepts a token issued after the password change', () => {
    const user = { passwordChangedAt: new Date(issuedAt * 1000 - 60_000) };
    assert.equal(isTokenStale({ iat: issuedAt }, user), false);
  });

  it('accepts tokens when no password change was ever recorded', () => {
    assert.equal(isTokenStale({ iat: issuedAt }, {}), false);
    assert.equal(isTokenStale({ iat: issuedAt }, { passwordChangedAt: undefined }), false);
    assert.equal(isTokenStale({ iat: issuedAt }, null), false);
  });

  it('accepts a token issued in the same second as the change', () => {
    const user = { passwordChangedAt: new Date(issuedAt * 1000) };
    assert.equal(isTokenStale({ iat: issuedAt }, user), false);
  });
});

describe('User model carries the hardening fields', () => {
  it('has passwordChangedAt and the pending-email fields', () => {
    for (const field of ['passwordChangedAt', 'pendingEmail', 'pendingEmailToken', 'pendingEmailExpires']) {
      assert.ok(User.schema.path(field), `missing schema path ${field}`);
    }
  });
});

describe('/rag validation — ragSchema', () => {
  it('accepts a short prompt with optional keywords', () => {
    const { error, value } = ragSchema.validate({ userPrompt: 'Explain photosynthesis', topicKeywords: ['biology'] });
    assert.equal(error, undefined);
    assert.equal(value.userPrompt, 'Explain photosynthesis');
  });

  it('rejects a missing or empty userPrompt', () => {
    assert.ok(ragSchema.validate({}).error);
    assert.ok(ragSchema.validate({ userPrompt: '   ' }).error);
  });

  it('rejects a userPrompt over 2000 characters', () => {
    const { error } = ragSchema.validate({ userPrompt: 'x'.repeat(2001) });
    assert.ok(error);
    assert.match(error.details[0].message, /2000/);
  });

  it('accepts a userPrompt of exactly 2000 characters', () => {
    assert.equal(ragSchema.validate({ userPrompt: 'x'.repeat(2000) }).error, undefined);
  });
});

describe('history limit caps', () => {
  it('caps ?limit at 100', () => {
    assert.equal(clampHistoryLimit('500'), MAX_HISTORY_LIMIT);
    assert.equal(clampHistoryLimit('100'), 100);
    assert.equal(clampHistoryLimit('25'), 25);
  });

  it('falls back to 10 for missing, zero, negative or non-numeric limits', () => {
    assert.equal(clampHistoryLimit(undefined), 10);
    assert.equal(clampHistoryLimit('0'), 10);
    assert.equal(clampHistoryLimit('-5'), 10);
    assert.equal(clampHistoryLimit('abc'), 10);
  });

  it('caps exports at 1000 rows', () => {
    assert.equal(EXPORT_LIMIT, 1000);
  });
});

describe('admin credit adjustment bounds', () => {
  it('accepts finite non-zero amounts within -1000..1000', () => {
    assert.equal(validateCreditAdjustment(50), null);
    assert.equal(validateCreditAdjustment(-50), null);
    assert.equal(validateCreditAdjustment(1000), null);
    assert.equal(validateCreditAdjustment(-1000), null);
  });

  it('rejects NaN, Infinity and non-numbers', () => {
    assert.match(validateCreditAdjustment(NaN), /finite/);
    assert.match(validateCreditAdjustment(Infinity), /finite/);
    assert.match(validateCreditAdjustment(-Infinity), /finite/);
    assert.match(validateCreditAdjustment('50'), /finite/);
    assert.match(validateCreditAdjustment(undefined), /finite/);
  });

  it('rejects zero and amounts outside -1000..1000', () => {
    assert.match(validateCreditAdjustment(0), /zero/);
    assert.match(validateCreditAdjustment(1001), /between/);
    assert.match(validateCreditAdjustment(-1001), /between/);
  });
});

describe('glossary persistence — persistApprovedTerm', () => {
  const tmpFile = async () => path.join(await fs.mkdtemp(path.join(os.tmpdir(), 'glossary-')), 'glossary.json');
  const term = { word: 'hello', language: 'urdu', suggestedTranslation: 'salam' };

  it('creates the file with languages + terms when missing', async () => {
    const file = await tmpFile();
    const saved = await persistApprovedTerm(term, file);
    assert.deepEqual(saved, { translations: { urdu: 'salam' } });
    const onDisk = JSON.parse(await fs.readFile(file, 'utf8'));
    assert.ok(Array.isArray(onDisk.languages) && onDisk.languages.includes('urdu'));
    assert.deepEqual(onDisk.terms.hello, { translations: { urdu: 'salam' } });
  });

  it('adds a second language to an existing term instead of overwriting', async () => {
    const file = await tmpFile();
    await persistApprovedTerm(term, file);
    await persistApprovedTerm({ word: 'hello', language: 'french', suggestedTranslation: 'bonjour' }, file);
    const onDisk = JSON.parse(await fs.readFile(file, 'utf8'));
    assert.deepEqual(onDisk.terms.hello.translations, { urdu: 'salam', french: 'bonjour' });
  });

  it('keeps unrelated terms already in the file', async () => {
    const file = await tmpFile();
    await persistApprovedTerm(term, file);
    await persistApprovedTerm({ word: 'thanks', language: 'urdu', suggestedTranslation: 'shukriya' }, file);
    const onDisk = JSON.parse(await fs.readFile(file, 'utf8'));
    assert.equal(Object.keys(onDisk.terms).length, 2);
  });

  it('points at the real glossary file, which exists with an empty terms map', async () => {
    assert.ok(GLOSSARY_PATH.endsWith(path.join('client', 'src', 'content', 'glossary.json')));
    const onDisk = JSON.parse(await fs.readFile(GLOSSARY_PATH, 'utf8'));
    assert.ok(Array.isArray(onDisk.languages) && onDisk.languages.length > 0);
    assert.deepEqual(onDisk.terms, {});
  });
});

describe('forgot-password / resend-verification limiter', () => {
  // Drive the real express-rate-limit middleware with fake req/res: 5
  // requests pass, the 6th for the same IP+email gets a 429.
  const run = (limiter, req) => new Promise((resolve) => {
    const res = {
      statusCode: 200,
      headers: {},
      headersSent: false,
      writableEnded: false,
      set(k, v) { this.headers[k] = v; },
      setHeader(k, v) { this.headers[k] = v; },
      getHeader(k) { return this.headers[k]; },
      status(code) { this.statusCode = code; return this; },
      json(body) { resolve({ status: this.statusCode, body }); },
      send(body) { resolve({ status: this.statusCode, body }); },
    };
    limiter(req, res, (err) => resolve({ status: err ? 500 : 200, error: err }));
  });

  it('allows 5 per hour per IP+email, then 429s', async () => {
    const req = () => ({ ip: '10.0.0.1', body: { email: 'a@example.com' }, headers: {} });
    for (let i = 0; i < 5; i += 1) assert.equal((await run(authEmailLimiter, req())).status, 200);
    const blocked = await run(authEmailLimiter, req());
    assert.equal(blocked.status, 429);
    assert.match(blocked.body.message, /try again/i);
  });

  it('does not block a different email from the same IP', async () => {
    const other = { ip: '10.0.0.1', body: { email: 'b@example.com' }, headers: {} };
    assert.equal((await run(authEmailLimiter, other)).status, 200);
  });
});
