// The client util is pure at import time (canvas/MediaRecorder are only
// touched inside functions), so node can import it directly.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeTargetSize } from '../../client/src/utils/compressMedia.js';

describe('computeTargetSize', () => {
  it('scales a 4000x3000 photo down to 1600x1200', () => {
    assert.deepEqual(computeTargetSize(4000, 3000), { width: 1600, height: 1200 });
  });

  it('never upscales a small image', () => {
    assert.deepEqual(computeTargetSize(800, 600), { width: 800, height: 600 });
  });

  it('scales a tall portrait by its long edge', () => {
    assert.deepEqual(computeTargetSize(1000, 3000), { width: 533, height: 1600 });
  });

  it('caps a 2000x2000 square at 1600x1600', () => {
    assert.deepEqual(computeTargetSize(2000, 2000), { width: 1600, height: 1600 });
  });

  it('passes zero dimensions through', () => {
    assert.deepEqual(computeTargetSize(0, 0), { width: 0, height: 0 });
  });
});
