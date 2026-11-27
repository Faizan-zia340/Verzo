// server/tests/uploadLimits.test.js
// Tests the daily upload-count limiter with NO database: the same
// node:test + node:assert/strict pattern as server/tests/creditReset.test.js.
// The fake model below emulates the MongoDB operators the limiter relies
// on (dotted paths, $ne, $lt, $set, $inc).
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createUploadLimiter,
  limitFor,
  todayKey,
  uploadLimitMessage,
  UPLOAD_LIMITS,
} from '../utils/uploadLimits.js';

// ── Minimal in-memory Mongoose stand-in (dotted paths) ───────────────
const getPath = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

const setPath = (obj, path, value) => {
  const keys = path.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (cur[keys[i]] == null || typeof cur[keys[i]] !== 'object') cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
};

const matchCondition = (val, cond) => {
  if (cond && typeof cond === 'object') {
    if ('$ne' in cond) return val !== cond.$ne;
    if ('$lt' in cond) return val !== undefined && val < cond.$lt;
    return false;
  }
  return val === cond;
};

const makeFakeUserModel = (seedDocs) => {
  const docs = new Map(seedDocs.map((d) => [d._id, JSON.parse(JSON.stringify(d))]));
  const matchDoc = (doc, filter) =>
    Object.entries(filter).every(([key, cond]) => matchCondition(getPath(doc, key), cond));
  const applyUpdate = (doc, update) => {
    if (update.$set) for (const [k, v] of Object.entries(update.$set)) setPath(doc, k, v);
    if (update.$inc) for (const [k, v] of Object.entries(update.$inc)) setPath(doc, k, (getPath(doc, k) || 0) + v);
  };
  return {
    docs,
    updateOne: async (filter, update) => {
      for (const doc of docs.values()) {
        if (!matchDoc(doc, filter)) continue;
        applyUpdate(doc, update);
        return { modifiedCount: 1 };
      }
      return { modifiedCount: 0 };
    },
    findOneAndUpdate: async (filter, update, opts) => {
      for (const doc of docs.values()) {
        if (!matchDoc(doc, filter)) continue;
        applyUpdate(doc, update);
        return opts?.new ? JSON.parse(JSON.stringify(doc)) : doc;
      }
      return null;
    },
  };
};

const yesterdayKey = () => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
};

describe('UPLOAD_LIMITS — free vs paid split', () => {
  it('free users get 10 images and 5 PDFs per day', () => {
    assert.deepEqual(UPLOAD_LIMITS.free, { images: 10, pdfs: 5 });
  });

  it('paid users (basic/pro) get 50 images and 20 PDFs per day', () => {
    assert.deepEqual(UPLOAD_LIMITS.basic, { images: 50, pdfs: 20 });
    assert.deepEqual(UPLOAD_LIMITS.pro, { images: 50, pdfs: 20 });
  });

  it('an unknown subscription is treated as free', () => {
    assert.deepEqual(limitFor('enterprise'), { images: 10, pdfs: 5 });
    assert.deepEqual(limitFor(undefined), { images: 10, pdfs: 5 });
  });

  it('todayKey is a UTC YYYY-MM-DD date', () => {
    assert.match(todayKey(), /^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('createUploadLimiter — daily counts', () => {
  it('counts a first image upload for a free user (used 1 of 10)', async () => {
    const User = makeFakeUserModel([{ _id: 'u1', uploadCounts: { day: todayKey(), images: 0, pdfs: 0 } }]);
    const { checkAndCount } = createUploadLimiter(User);
    const result = await checkAndCount('u1', 'free', 'image');
    assert.deepEqual(result, { allowed: true, limit: 10, used: 1 });
  });

  it('blocks a free user at the 10-image cap (11th upload)', async () => {
    const User = makeFakeUserModel([{ _id: 'u1', uploadCounts: { day: todayKey(), images: 9, pdfs: 0 } }]);
    const { checkAndCount } = createUploadLimiter(User);
    assert.deepEqual(await checkAndCount('u1', 'free', 'image'), { allowed: true, limit: 10, used: 10 });
    assert.deepEqual(await checkAndCount('u1', 'free', 'image'), { allowed: false, limit: 10, used: 10 });
  });

  it('blocks a free user at the 5-PDF cap (6th upload)', async () => {
    const User = makeFakeUserModel([{ _id: 'u1', uploadCounts: { day: todayKey(), images: 0, pdfs: 5 } }]);
    const { checkAndCount } = createUploadLimiter(User);
    assert.deepEqual(await checkAndCount('u1', 'free', 'pdf'), { allowed: false, limit: 5, used: 5 });
  });

  it('keeps image and PDF counters separate', async () => {
    const User = makeFakeUserModel([{ _id: 'u1', uploadCounts: { day: todayKey(), images: 10, pdfs: 0 } }]);
    const { checkAndCount } = createUploadLimiter(User);
    assert.deepEqual(await checkAndCount('u1', 'free', 'image'), { allowed: false, limit: 10, used: 10 });
    assert.deepEqual(await checkAndCount('u1', 'free', 'pdf'), { allowed: true, limit: 5, used: 1 });
  });

  it('lets a paid user past the free cap (11th image allowed, 51st blocked)', async () => {
    const User = makeFakeUserModel([{ _id: 'u1', uploadCounts: { day: todayKey(), images: 10, pdfs: 0 } }]);
    const { checkAndCount } = createUploadLimiter(User);
    assert.deepEqual(await checkAndCount('u1', 'basic', 'image'), { allowed: true, limit: 50, used: 11 });
    User.docs.get('u1').uploadCounts.images = 50;
    assert.deepEqual(await checkAndCount('u1', 'pro', 'image'), { allowed: false, limit: 50, used: 50 });
  });

  it('resets the counter on a new day, even when yesterday hit the cap', async () => {
    const User = makeFakeUserModel([
      { _id: 'u1', uploadCounts: { day: yesterdayKey(), images: 10, pdfs: 5 } },
    ]);
    const { checkAndCount } = createUploadLimiter(User);
    assert.deepEqual(await checkAndCount('u1', 'free', 'image'), { allowed: true, limit: 10, used: 1 });
    assert.equal(User.docs.get('u1').uploadCounts.day, todayKey());
    assert.equal(User.docs.get('u1').uploadCounts.pdfs, 0);
  });

  it('repairs an account that never had a counter (no uploadCounts field)', async () => {
    const User = makeFakeUserModel([{ _id: 'u1' }]);
    const { checkAndCount } = createUploadLimiter(User);
    assert.deepEqual(await checkAndCount('u1', 'free', 'pdf'), { allowed: true, limit: 5, used: 1 });
    assert.equal(User.docs.get('u1').uploadCounts.day, todayKey());
  });
});

describe('uploadLimitMessage — brand-safe 429 text', () => {
  it('tells a free user the limit and to upgrade or wait', () => {
    const msg = uploadLimitMessage('free', 'image', 10);
    assert.match(msg, /10 image uploads per day/);
    assert.match(msg, /Upgrade/);
    assert.match(msg, /tomorrow/);
  });

  it('does not offer an upgrade to a paid user', () => {
    const msg = uploadLimitMessage('pro', 'pdf', 20);
    assert.match(msg, /20 PDF uploads per day/);
    assert.doesNotMatch(msg, /Upgrade/);
  });

  it('never names the AI provider', () => {
    for (const sub of ['free', 'basic', 'pro']) {
      for (const kind of ['image', 'pdf']) {
        assert.doesNotMatch(uploadLimitMessage(sub, kind, 10), /gemini|google|openai|claude/i);
      }
    }
  });
});
