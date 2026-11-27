// migrate-test-to-aicg.mjs — Copy every collection from the `test`
// database to `ai-content-generator` on the same Atlas cluster.
//
// Why: the app never set a dbName, so Mongoose defaulted to `test`.
// The `ai-content-generator` database exists but is empty. This script
// copies the live data over BEFORE the code is switched to
// dbName: 'ai-content-generator' (see server/config/database.js),
// so no user, credit, content or feedback row is lost.
//
// Usage:
//   MONGODB_URI='mongodb+srv://<user>:<pass>@cluster0.zs5rq7q.mongodb.net/?...' \
//     node scripts/migrate-test-to-aicg.mjs
//
// The URI must NOT name a database (or must name `test`); the script
// picks the source and target databases explicitly. It is idempotent:
// re-running it upserts by _id, so it can be re-run safely.

import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is not set.');
  process.exit(1);
}

const SOURCE_DB = 'test';
const TARGET_DB = 'ai-content-generator';

const client = new MongoClient(uri);
await client.connect();
console.log('Connected to', client.options.hosts?.map((h) => `${h.host}:${h.port}`).join(',') || 'Atlas');

const source = client.db(SOURCE_DB);
const target = client.db(TARGET_DB);

const collections = await source.listCollections().toArray();
console.log(`Found ${collections.length} collection(s) in '${SOURCE_DB}': ${collections.map((c) => c.name).join(', ')}`);

for (const { name } of collections) {
  const docs = await source.collection(name).find({}).toArray();
  if (docs.length === 0) {
    console.log(`  ${name}: 0 documents — nothing to copy.`);
    continue;
  }
  const ops = docs.map((d) => ({
    replaceOne: { filter: { _id: d._id }, replacement: d, upsert: true },
  }));
  const res = await target.collection(name).bulkWrite(ops, { ordered: false });
  console.log(`  ${name}: ${docs.length} documents — upserted ${res.upsertedCount}, replaced ${res.modifiedCount}.`);
}

// Verify: count documents in the target.
console.log('\nVerification (target database):');
for (const { name } of collections) {
  const n = await target.collection(name).countDocuments();
  console.log(`  ${TARGET_DB}.${name}: ${n} document(s)`);
}

await client.close();
console.log('\nDone. The data now lives in both databases; the app can be switched to ai-content-generator.');
