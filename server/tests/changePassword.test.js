// server/tests/changePassword.test.js
// Change password while signed in: wrong current password, validation,
// success (hash rotates, old password stops working, passwordChangedAt
// set), missing user, and route wiring. Handler tests use a fake user
// (no database), following the feedbackThanks.test.js pattern.
// Note: asyncHandler does not return its promise, so each call waits on
// the response being sent instead of awaiting the handler.
import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { changePassword } from '../controllers/userController.js';
import { changePasswordSchema } from '../utils/validators.js';
import userRouter from '../routes/user.js';

const origFindById = User.findById;
afterEach(() => { User.findById = origFindById; });

// A promise that resolves with { statusCode, body } when the handler
// answers. The wrapped handler never calls next() on success.
const runHandler = (user, body) => {
  User.findById = async () => user;
  return new Promise((resolve, reject) => {
    const res = {
      status(code) { this.statusCode = code; return this; },
      json(payload) { resolve({ statusCode: this.statusCode, body: payload }); },
    };
    changePassword({ user: { _id: 'u1' }, body }, res, reject);
  });
};

// Fake user that honours the real model contract: comparePassword checks
// bcryptjs, save() hashes a changed password like the pre-save hook does.
const makeUser = async () => {
  const user = {
    _id: 'u1',
    password: await bcrypt.hash('oldpass123', 12),
    passwordChangedAt: undefined,
    saved: false,
  };
  user.comparePassword = (candidate) => bcrypt.compare(candidate, user.password);
  user.save = async () => {
    if (!/^\$2[aby]\$/.test(user.password)) user.password = await bcrypt.hash(user.password, 12);
    user.saved = true;
  };
  return user;
};

describe('changePasswordSchema', () => {
  it('accepts a current + new password of 6 or more characters', () => {
    const { error } = changePasswordSchema.validate({ currentPassword: 'oldpass123', newPassword: 'newpass123' });
    assert.equal(error, undefined);
  });

  it('rejects a missing current password', () => {
    assert.ok(changePasswordSchema.validate({ newPassword: 'newpass123' }).error);
  });

  it('rejects a missing new password', () => {
    assert.ok(changePasswordSchema.validate({ currentPassword: 'oldpass123' }).error);
  });

  it('rejects a new password shorter than 6 characters', () => {
    const { error } = changePasswordSchema.validate({ currentPassword: 'oldpass123', newPassword: 'short' });
    assert.ok(error);
  });
});

describe('changePassword handler', () => {
  it('rejects a wrong current password with 401 and changes nothing', async () => {
    const user = await makeUser();
    const res = await runHandler(user, { currentPassword: 'wrongpass', newPassword: 'newpass123' });
    assert.equal(res.statusCode, 401);
    assert.match(res.body.message, /Current password is incorrect/);
    assert.equal(user.saved, false);
    assert.equal(user.passwordChangedAt, undefined);
    assert.equal(await bcrypt.compare('oldpass123', user.password), true);
  });

  it('changes the password, sets passwordChangedAt, old password stops working', async () => {
    const user = await makeUser();
    const res = await runHandler(user, { currentPassword: 'oldpass123', newPassword: 'newpass123' });
    assert.equal(res.statusCode, 200);
    assert.match(res.body.message, /sign in again/);
    assert.equal(user.saved, true);
    assert.ok(user.passwordChangedAt instanceof Date);
    assert.equal(await bcrypt.compare('newpass123', user.password), true);
    assert.equal(await bcrypt.compare('oldpass123', user.password), false);
  });

  it('returns 404 when the user no longer exists', async () => {
    const res = await runHandler(null, { currentPassword: 'oldpass123', newPassword: 'newpass123' });
    assert.equal(res.statusCode, 404);
  });
});

describe('change-password route wiring', () => {
  it('is registered as POST /change-password on the user router', () => {
    const layer = userRouter.stack.find(
      (l) => l.route?.path === '/change-password' && l.route?.methods?.post,
    );
    assert.ok(layer, 'POST /change-password not found on the user router');
  });
});
