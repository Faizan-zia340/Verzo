import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateImageFile, ALLOWED_IMAGE_MIMES, MAX_IMAGE_BYTES } from '../utils/imageInput.js';

const file = (overrides = {}) => ({
  mimetype: 'image/jpeg',
  buffer: Buffer.from('fake-image-bytes'),
  ...overrides,
});

describe('validateImageFile', () => {
  it('accepts a small JPG', () => {
    assert.equal(validateImageFile(file()), null);
  });

  it('accepts PNG and WebP', () => {
    for (const mimetype of ['image/png', 'image/webp']) {
      assert.equal(validateImageFile(file({ mimetype })), null);
    }
  });

  it('rejects GIF and other types', () => {
    const err = validateImageFile(file({ mimetype: 'image/gif' }));
    assert.match(err, /Unsupported image type/);
    assert.match(err, /JPG, PNG or WebP/);
  });

  it('rejects files over 5 MB', () => {
    const err = validateImageFile(file({ buffer: Buffer.alloc(MAX_IMAGE_BYTES + 1) }));
    assert.match(err, /too large/);
    assert.match(err, /5 MB/);
  });

  it('accepts a file exactly at the 5 MB limit', () => {
    assert.equal(validateImageFile(file({ buffer: Buffer.alloc(MAX_IMAGE_BYTES) })), null);
  });

  it('rejects a missing file', () => {
    assert.match(validateImageFile(null), /image file is required/);
    assert.match(validateImageFile(undefined), /image file is required/);
  });

  it('rejects an empty buffer', () => {
    assert.match(validateImageFile(file({ buffer: Buffer.alloc(0) })), /empty/);
  });

  it('exports the allowed mime list', () => {
    assert.deepEqual(ALLOWED_IMAGE_MIMES, ['image/jpeg', 'image/png', 'image/webp']);
  });
});
