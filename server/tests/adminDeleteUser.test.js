import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getDeleteBlockReason } from '../utils/adminDelete.js';

const adminId = '64f0000000000000000000aa';
const userId = '64f0000000000000000000bb';
const otherAdminId = '64f0000000000000000000cc';

describe('getDeleteBlockReason', () => {
  it('blocks deleting your own account (403)', () => {
    const block = getDeleteBlockReason({
      requesterId: adminId,
      target: { _id: adminId, email: 'admin@example.com', isAdmin: true },
    });
    assert.equal(block.status, 403);
    assert.match(block.message, /own account/i);
  });

  it('blocks deleting your own account even when the target is not flagged admin', () => {
    const block = getDeleteBlockReason({
      requesterId: userId,
      target: { _id: userId, email: 'me@example.com', isAdmin: false },
    });
    assert.equal(block.status, 403);
  });

  it('blocks deleting another admin account (403)', () => {
    const block = getDeleteBlockReason({
      requesterId: adminId,
      target: { _id: otherAdminId, email: 'other-admin@example.com', isAdmin: true },
    });
    assert.equal(block.status, 403);
    assert.match(block.message, /Admin accounts cannot be deleted/);
  });

  it('allows deleting a regular user (null)', () => {
    const block = getDeleteBlockReason({
      requesterId: adminId,
      target: { _id: userId, email: 'user@example.com', isAdmin: false },
    });
    assert.equal(block, null);
  });

  it('returns 404 when the target user does not exist', () => {
    const block = getDeleteBlockReason({ requesterId: adminId, target: null });
    assert.equal(block.status, 404);
    assert.match(block.message, /not found/i);
  });

  it('compares ids as strings (ObjectId-like objects still match)', () => {
    const objectIdLike = { toString: () => adminId };
    const block = getDeleteBlockReason({
      requesterId: adminId,
      target: { _id: objectIdLike, email: 'admin@example.com', isAdmin: true },
    });
    assert.equal(block.status, 403);
  });
});
