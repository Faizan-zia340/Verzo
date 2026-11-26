// ===== FILE 1: server/tests/mediaStorage.test.js =====
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  uploadImage,
  uploadAudio,
  deleteMedia,
  buildUploadFolder,
  imageTransformations,
  audioTransformations,
  mediaResourceType,
  MediaNotConfiguredError,
  MAX_UPLOAD_BYTES,
} from '../utils/mediaStorage.js';

const CLOUD_KEYS = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
let savedEnv;

const setConfigured = () => {
  savedEnv = {};
  for (const k of CLOUD_KEYS) {
    savedEnv[k] = process.env[k];
    process.env[k] = `test-${k.toLowerCase()}`;
  }
};

const restoreEnv = () => {
  for (const k of CLOUD_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
};

const fakeCloudinary = (impl = {}) => ({
  uploader: {
    upload: async (dataUri, opts) => ({
      secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/penlix/abc/test.webp',
      public_id: 'penlix/abc/test',
      bytes: 12345,
      format: 'webp',
      ...impl.uploadResult,
    }),
    destroy: async (publicId, opts) => ({ result: 'ok', ...impl.destroyResult }),
  },
});

describe('buildUploadFolder', () => {
  it('namespaces uploads per user', () => {
    assert.equal(buildUploadFolder('64f0000000000000000000aa'), 'penlix/64f0000000000000000000aa');
  });

  it('strips characters that could escape the folder', () => {
    assert.equal(buildUploadFolder('../../etc'), 'penlix/etc');
  });
});

describe('transformations', () => {
  it('caps images at 1600px with auto quality + format', () => {
    const t = imageTransformations()[0];
    assert.equal(t.width, 1600);
    assert.equal(t.crop, 'limit');
    assert.equal(t.quality, 'auto');
    assert.equal(t.fetch_format, 'auto');
  });

  it('converts audio to 64k mp3', () => {
    const t = audioTransformations()[0];
    assert.equal(t.audio_codec, 'mp3');
    assert.equal(t.bit_rate, '64k');
  });

  it('maps audio to Cloudinary video resource type', () => {
    assert.equal(mediaResourceType('audio'), 'video');
    assert.equal(mediaResourceType('image'), 'image');
    assert.equal(mediaResourceType(''), 'image');
  });
});

describe('uploadImage (fake Cloudinary client)', () => {
  beforeEach(setConfigured);
  afterEach(restoreEnv);

  it('uploads to the user folder with image transformations', async () => {
    let captured;
    const fake = fakeCloudinary();
    const origUpload = fake.uploader.upload;
    fake.uploader.upload = async (dataUri, opts) => {
      captured = { dataUri, opts };
      return origUpload(dataUri, opts);
    };
    const out = await uploadImage(Buffer.from('fake-jpeg'), {
      userId: '64f0000000000000000000aa',
      filename: 'photo.jpg',
      mimeType: 'image/jpeg',
    }, { cloudinary: fake });
    assert.equal(out.mediaType, 'image');
    assert.equal(out.mediaPublicId, 'penlix/abc/test');
    assert.match(out.mediaUrl, /^https:\/\/res\.cloudinary\.com\//);
    assert.equal(captured.opts.folder, 'penlix/64f0000000000000000000aa');
    assert.equal(captured.opts.resource_type, 'image');
    assert.equal(captured.opts.transformation[0].width, 1600);
    assert.match(captured.dataUri, /^data:image\/jpeg;base64,/);
  });

  it('rejects files over 5 MB without calling Cloudinary', async () => {
    let called = false;
    const fake = fakeCloudinary();
    fake.uploader.upload = async () => {
      called = true;
      return {};
    };
    await assert.rejects(
      uploadImage(Buffer.alloc(MAX_UPLOAD_BYTES + 1), { userId: 'u1' }, { cloudinary: fake }),
      (err) => err.status === 413
    );
    assert.equal(called, false);
  });

  it('throws MediaNotConfiguredError when keys are missing (route maps to 503)', async () => {
    for (const k of CLOUD_KEYS) delete process.env[k];
    await assert.rejects(
      uploadImage(Buffer.from('x'), { userId: 'u1' }, { cloudinary: fakeCloudinary() }),
      (err) => err instanceof MediaNotConfiguredError && err.status === 503
    );
  });
});

describe('uploadAudio (fake Cloudinary client)', () => {
  beforeEach(setConfigured);
  afterEach(restoreEnv);

  it('uploads as video resource with mp3 format + 64k transform', async () => {
    let captured;
    const fake = fakeCloudinary();
    fake.uploader.upload = async (dataUri, opts) => {
      captured = { dataUri, opts };
      return { secure_url: 'https://res.cloudinary.com/demo/video/upload/v1/x.mp3', public_id: 'penlix/u1/a', bytes: 999, format: 'mp3' };
    };
    const out = await uploadAudio(Buffer.from('fake-mp3'), {
      userId: 'u1',
      filename: 'voice.mp3',
      mimeType: 'audio/mpeg',
    }, { cloudinary: fake });
    assert.equal(out.mediaType, 'audio');
    assert.equal(captured.opts.resource_type, 'video');
    assert.equal(captured.opts.format, 'mp3');
    assert.equal(captured.opts.transformation[0].bit_rate, '64k');
  });
});

describe('deleteMedia (best-effort)', () => {
  beforeEach(setConfigured);
  afterEach(restoreEnv);

  it('destroys by public_id and reports ok', async () => {
    let captured;
    const fake = fakeCloudinary();
    fake.uploader.destroy = async (publicId, opts) => {
      captured = { publicId, opts };
      return { result: 'ok' };
    };
    const out = await deleteMedia('penlix/u1/a', { resourceType: 'video' }, { cloudinary: fake });
    assert.equal(out.ok, true);
    assert.equal(captured.publicId, 'penlix/u1/a');
    assert.equal(captured.opts.resource_type, 'video');
  });

  it('treats "not found" as clean (file already gone)', async () => {
    const fake = fakeCloudinary();
    fake.uploader.destroy = async () => ({ result: 'not found' });
    const out = await deleteMedia('penlix/u1/gone', {}, { cloudinary: fake });
    assert.equal(out.ok, true);
  });

  it('never throws when Cloudinary fails (history delete must still succeed)', async () => {
    const fake = fakeCloudinary();
    fake.uploader.destroy = async () => {
      throw new Error('boom');
    };
    const out = await deleteMedia('penlix/u1/a', {}, { cloudinary: fake });
    assert.equal(out.ok, false);
  });

  it('skips silently when unconfigured or public_id is empty', async () => {
    for (const k of CLOUD_KEYS) delete process.env[k];
    assert.deepEqual(await deleteMedia('penlix/u1/a', {}, { cloudinary: fakeCloudinary() }), {
      ok: false,
      skipped: true,
    });
    assert.deepEqual(await deleteMedia('', {}, { cloudinary: fakeCloudinary() }), {
      ok: false,
      skipped: true,
    });
  });
});

