// server/utils/dbBackup.js
// Daily JSON dump of every collection to Cloudinary (private raw files).
// Pure factory — models + Cloudinary client are injected, so tests run
// with fakes and no database. Logs names + counts only, never contents.
import logger from './logger.js';

export const BACKUP_FOLDER = 'penlix-backups';
export const BACKUP_RETENTION_DAYS = 7;

const dateStamp = (d = new Date()) => d.toISOString().slice(0, 10);

const uploadBuffer = (client, buffer, opts) =>
  new Promise((resolve, reject) => {
    const stream = client.uploader.upload_stream(opts, (err, result) =>
      err ? reject(err) : resolve(result)
    );
    stream.end(buffer);
  });

export const createDbBackup = (collections, deps = {}) => {
  const cloudinary = deps.cloudinary;
  const log = deps.logger || logger;

  const dumpCollection = async ({ name, model }) => {
    const docs = await model.find({}).lean();
    const body = JSON.stringify(docs);
    const result = await uploadBuffer(cloudinary, Buffer.from(body), {
      public_id: `${BACKUP_FOLDER}/${name}-${dateStamp()}`,
      resource_type: 'raw',
      type: 'private',
      overwrite: true,
    });
    return { name, count: docs.length, publicId: result.public_id, bytes: Buffer.byteLength(body) };
  };

  const pruneOld = async ({ name }) => {
    const { resources = [] } = await cloudinary.api.resources({
      resource_type: 'raw',
      type: 'private',
      prefix: `${BACKUP_FOLDER}/${name}-`,
      max_results: 100,
    });
    const cutoff = Date.now() - BACKUP_RETENTION_DAYS * 86400000;
    const stale = resources
      .filter((r) => new Date(r.created_at).getTime() < cutoff)
      .map((r) => r.public_id);
    if (stale.length) {
      await cloudinary.api.delete_resources(stale, { resource_type: 'raw', type: 'private' });
    }
    return stale.length;
  };

  const runBackup = async () => {
    const results = [];
    for (const { name, model } of collections) {
      try {
        const dumped = await dumpCollection({ name, model });
        let pruned = 0;
        try {
          pruned = await pruneOld({ name });
        } catch (err) {
          log.warn({ err: err.message, collection: name }, 'Backup retention cleanup failed (best-effort)');
        }
        log.info(
          { collection: name, count: dumped.count, publicId: dumped.publicId, bytes: dumped.bytes, pruned },
          'Daily backup uploaded'
        );
        results.push({ ...dumped, pruned, ok: true });
      } catch (err) {
        // One collection failing must not kill the rest — or the server.
        log.error({ err: err.message, collection: name }, 'Daily backup failed for collection');
        results.push({ name, ok: false, error: err.message });
      }
    }
    return results;
  };

  return { runBackup, dumpCollection, pruneOld, dateStamp };
};

export default { createDbBackup, BACKUP_FOLDER, BACKUP_RETENTION_DAYS };
