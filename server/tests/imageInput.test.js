import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateImageFile, applyImageDefaults, ALLOWED_IMAGE_MIMES, MAX_IMAGE_BYTES } from '../utils/imageInput.js';
import { generateSchema } from '../utils/validators.js';

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

// ChatGPT-style image flow: upload a photo, pick a type, submit — no
// prompt or details needed. applyImageDefaults fills them so the strict
// generateSchema (still enforced on / and /stream) passes.
describe('applyImageDefaults', () => {
  it('defaults an image-only blog request and the strict schema passes it', () => {
    const body = { type: 'blog', prompt: '', topic: '', audience: '' };
    const out = applyImageDefaults(body);
    assert.equal(out.prompt, "Write a blog post about what's in this photo.");
    assert.equal(out.topic, 'The photo');
    assert.equal(out.audience, 'General readers');
    const { error, value } = generateSchema.validate(out);
    assert.equal(error, undefined);
    assert.equal(value.prompt, out.prompt);
  });

  it('replaces a prompt shorter than 10 chars', () => {
    const out = applyImageDefaults({ type: 'blog', prompt: 'chai', topic: 'Tea', audience: 'All' });
    assert.equal(out.prompt, "Write a blog post about what's in this photo.");
  });

  it('keeps a prompt of 10+ chars and provided details', () => {
    const out = applyImageDefaults({ type: 'blog', prompt: 'Write about chai culture.', topic: 'Chai', audience: 'Tea lovers' });
    assert.equal(out.prompt, 'Write about chai culture.');
    assert.equal(out.topic, 'Chai');
    assert.equal(out.audience, 'Tea lovers');
  });

  it('uses a type-aware prompt name', () => {
    assert.equal(
      applyImageDefaults({ type: 'social', prompt: '' }).prompt,
      "Write a social media post about what's in this photo."
    );
    assert.equal(
      applyImageDefaults({ type: 'product', prompt: '' }).prompt,
      "Write a product description about what's in this photo."
    );
    assert.equal(
      applyImageDefaults({ type: 'email', prompt: '' }).prompt,
      "Write an email about what's in this photo."
    );
    assert.equal(
      applyImageDefaults({ type: 'ad', prompt: '' }).prompt,
      "Write an ad about what's in this photo."
    );
  });

  it('defaults purpose required fields (email job-posting)', () => {
    const out = applyImageDefaults({ type: 'email', purpose: 'job-posting', prompt: '' });
    assert.equal(out.company, 'The company in the photo');
    assert.equal(out.role, 'The role in the photo');
    assert.equal(out.location, 'The location in the photo');
    assert.equal(out.senderName, 'The sender');
    // applyLink is satisfied by its alternate, contact.
    assert.equal(out.contact, 'See the photo for contact details');
    const { error } = generateSchema.validate(out);
    assert.equal(error, undefined);
  });

  it('falls back to per-type fields for an unknown purpose', () => {
    const out = applyImageDefaults({ type: 'ad', purpose: 'not-a-purpose', prompt: '' });
    assert.equal(out.product, 'The product in the photo');
    assert.equal(out.audience, 'General readers');
    assert.equal(out.cta, 'Learn more');
    const { error } = generateSchema.validate(out);
    assert.equal(error, undefined);
  });

  it('does not mutate the input object', () => {
    const body = { type: 'blog', prompt: '', topic: '', audience: '' };
    applyImageDefaults(body);
    assert.equal(body.prompt, '');
    assert.equal(body.topic, '');
  });

  it('the strict schema still rejects a prompt-less body without defaults', () => {
    const { error } = generateSchema.validate({ type: 'blog', prompt: '' });
    assert.match(error.message, /prompt/);
  });
});
