// server/tests/dbBackup.test.js
// Tests the daily backup with NO database and NO Cloudinary: fake models
// + a fake Cloudinary client, same node:test pattern as creditReset.test.js.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Writable } from 'node:stream';
import { createDbBackup, BACKUP_FOLDER, BACKUP_RETENTION_DAYS } from '../utils/dbBackup.js';
import { runDailyBackup } from '../jobs/dailyBackup.js';

// Fake Mongoose model: find({}).lean() resolves to the seeded docs.
const makeFakeModel = (name, docs) => ({
  collection: { name },
  find: () => ({ lean: async () => docs.map((d) => ({ ...d })) }),
});

// Fake Cloudinary client: captures upload_stream buffers + options,
// serves a canned resource list, records deletions.
const makeFakeCloudinary = ({ resources = [], uploadError = null } = {}) => {
  const uploads = [];
  const deleted = [];
  return {
    uploads,
    deleted,
    uploader: {
      upload_stream: (opts, cb) => {
        const chunks = [];
        return new Writable({
          write(chunk, _enc, next) {
            chunks.push(chunk);
            next();
          },
          final(done) {
            uploads.push({ opts, body: Buffer.concat(chunks).toString() });
            if (uploadError) cb(new Error(uploadError));
            else cb(null, { public_id: opts.public_id });
            done();
          },
        });
      },
    },
    api: {
      resources: async () => ({ resources }),
      delete_resources: async (ids) => {
        deleted.push(...ids);
        return {};
      },
    },
  };
};

const silentLogger = { info: () => {}, warn: () => {}, error: () => {} };
const today = new Date().toISOString().slice(0, 10);

describe('createDbBackup — dump + upload', () => {
  it('uploads one private raw file per collection, dated today', async () => {
    const cloudinary = makeFakeCloudinary();
    const { runBackup } = createDbBackup(
      [
        { name: 'users', model: makeFakeModel('users', [{ _id: 'u1', email: 'a@b.c' }]) },
        { name: 'contents', model: makeFakeModel('contents', [{ _id: 'c1' }, { _id: 'c2' }]) },
      ],
      { cloudinary, logger: silentLogger }
    );
    const results = await runBackup();
    assert.deepEqual(
      results.map((r) => r.ok),
      [true, true]
    );
    assert.equal(cloudinary.uploads.length, 2);
    const [first] = cloudinary.uploads;
    assert.equal(first.opts.public_id, `${BACKUP_FOLDER}/users-${today}`);
    assert.equal(first.opts.resource_type, 'raw');
    assert.equal(first.opts.type, 'private');
    assert.equal(first.opts.overwrite, true);
    assert.deepEqual(JSON.parse(first.body), [{ _id: 'u1', email: 'a@b.c' }]);
    assert.equal(results[0].count, 1);
    assert.equal(results[1].count, 2);
  });

  it('serializes an empty collection as an empty JSON array', async () => {
    const cloudinary = makeFakeCloudinary();
    const { runBackup } = createDbBackup(
      [{ name: 'payments', model: makeFakeModel('payments', []) }],
      { cloudinary, logger: silentLogger }
    );
    const [result] = await runBackup();
    assert.equal(result.ok, true);
    assert.equal(result.count, 0);
    assert.equal(cloudinary.uploads[0].body, '[]');
  });

  it('dateStamp is YYYY-MM-DD', () => {
    const { dateStamp } = createDbBackup([], { cloudinary: makeFakeCloudinary(), logger: silentLogger });
    assert.match(dateStamp(), /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(dateStamp(), today);
  });
});

describe('createDbBackup — retention', () => {
  it('deletes files older than 7 days, keeps the rest', async () => {
    const old = new Date(Date.now() - 8 * 86400000).toISOString();
    const recent = new Date(Date.now() - 2 * 86400000).toISOString();
    const cloudinary = makeFakeCloudinary({
      resources: [
        { public_id: `${BACKUP_FOLDER}/users-2026-11-20`, created_at: old },
        { public_id: `${BACKUP_FOLDER}/users-2026-11-26`, created_at: recent },
      ],
    });
    const { runBackup } = createDbBackup(
      [{ name: 'users', model: makeFakeModel('users', []) }],
      { cloudinary, logger: silentLogger }
    );
    const [result] = await runBackup();
    assert.equal(result.ok, true);
    assert.equal(result.pruned, 1);
    assert.deepEqual(cloudinary.deleted, [`${BACKUP_FOLDER}/users-2026-11-20`]);
    assert.equal(BACKUP_RETENTION_DAYS, 7);
  });

  it('deletes nothing when every snapshot is within retention', async () => {
    const cloudinary = makeFakeCloudinary({
      resources: [{ public_id: `${BACKUP_FOLDER}/users-${today}`, created_at: new Date().toISOString() }],
    });
    const { runBackup } = createDbBackup(
      [{ name: 'users', model: makeFakeModel('users', []) }],
      { cloudinary, logger: silentLogger }
    );
    const [result] = await runBackup();
    assert.equal(result.pruned, 0);
    assert.deepEqual(cloudinary.deleted, []);
  });

  it('a retention cleanup failure is swallowed, backup still succeeds', async () => {
    const cloudinary = makeFakeCloudinary();
    cloudinary.api.resources = async () => {
      throw new Error('admin api down');
    };
    const { runBackup } = createDbBackup(
      [{ name: 'users', model: makeFakeModel('users', [{ _id: 'u1' }]) }],
      { cloudinary, logger: silentLogger }
    );
    const [result] = await runBackup();
    assert.equal(result.ok, true);
    assert.equal(result.pruned, 0);
    assert.equal(result.count, 1);
  });
});

describe('createDbBackup — failure path', () => {
  it('a failing collection does not stop the others and never throws', async () => {
    const failing = {
      collection: { name: 'users' },
      find: () => {
        throw new Error('db down');
      },
    };
    const cloudinary = makeFakeCloudinary();
    const { runBackup } = createDbBackup(
      [
        { name: 'users', model: failing },
        { name: 'credits', model: makeFakeModel('credits', [{ _id: 'c1' }]) },
      ],
      { cloudinary, logger: silentLogger }
    );
    const results = await runBackup();
    assert.deepEqual(
      results.map((r) => r.ok),
      [false, true]
    );
    assert.equal(results[0].error, 'db down');
    assert.equal(cloudinary.uploads.length, 1);
    assert.equal(cloudinary.uploads[0].opts.public_id, `${BACKUP_FOLDER}/credits-${today}`);
  });

  it('a Cloudinary upload error is reported per collection, never thrown', async () => {
    const cloudinary = makeFakeCloudinary({ uploadError: 'upload failed' });
    const { runBackup } = createDbBackup(
      [{ name: 'users', model: makeFakeModel('users', [{ _id: 'u1' }]) }],
      { cloudinary, logger: silentLogger }
    );
    const [result] = await runBackup();
    assert.equal(result.ok, false);
    assert.equal(result.error, 'upload failed');
  });
});

describe('dailyBackup wiring', () => {
  it('the 7 real models expose the expected collection names', async () => {
    const names = [];
    for (const n of ['User', 'Content', 'Credit', 'Context', 'Feedback', 'Suggestion', 'Payment']) {
      const mod = await import(`../models/${n}.js`);
      names.push(mod.default.collection.name);
    }
    assert.deepEqual(names, ['users', 'contents', 'credits', 'contexts', 'feedbacks', 'suggestions', 'payments']);
  });

  it('skips the run (no throw) when Cloudinary is not configured', async () => {
    const saved = {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
    };
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;
    try {
      assert.deepEqual(await runDailyBackup(), []);
    } finally {
      if (saved.cloudName !== undefined) process.env.CLOUDINARY_CLOUD_NAME = saved.cloudName;
      if (saved.apiKey !== undefined) process.env.CLOUDINARY_API_KEY = saved.apiKey;
      if (saved.apiSecret !== undefined) process.env.CLOUDINARY_API_SECRET = saved.apiSecret;
    }
  });
});
