// server/tests/feedbackThanks.test.js
// Marking a bug/suggestion report as fixed thanks the reporter by email.
// Handler tests use fake models (no database) and a mock mail sender
// (no real email); the route's protect + isAdmin chain is tested via isAdmin.
import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import Feedback from '../models/Feedback.js';
import User from '../models/User.js';
import { resolveFeedbackHandler } from '../routes/feedback.js';
import isAdmin from '../middleware/isAdmin.js';
import { sendFeedbackThanksEmail } from '../utils/sendEmail.js';

const mockRes = () => {
  const res = {};
  res.done = new Promise((resolve) => { res._resolve = resolve; });
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; res._resolve(); return res; };
  return res;
};

const fakeFeedback = (overrides = {}) => ({
  _id: 'fb1',
  page: '/dashboard',
  category: 'Bug',
  message: 'Button is white in dark mode',
  name: 'Ghufran',
  user: 'user1',
  status: 'open',
  resolvedAt: null,
  saved: false,
  async save() { this.saved = true; },
  toObject() {
    return { _id: this._id, page: this.page, category: this.category, message: this.message, name: this.name, user: this.user, status: this.status, resolvedAt: this.resolvedAt };
  },
  ...overrides,
});

const origFeedbackFindById = Feedback.findById;
const origUserFindById = User.findById;
afterEach(() => {
  Feedback.findById = origFeedbackFindById;
  User.findById = origUserFindById;
});

const run = async (handler, req) => {
  const res = mockRes();
  handler(req, res, () => res._resolve());
  await res.done;
  return res;
};

describe('Feedback model carries the resolve fields', () => {
  it('has status (open/resolved, default open) and resolvedAt', () => {
    assert.ok(Feedback.schema.path('status'));
    assert.ok(Feedback.schema.path('resolvedAt'));
    assert.deepEqual(Feedback.schema.path('status').enumValues, ['open', 'resolved']);
    assert.equal(Feedback.schema.path('status').defaultValue, 'open');
  });
});

describe('PATCH /api/feedback/:id/resolve — resolveFeedbackHandler', () => {
  it('marks resolved, stamps resolvedAt, and emails the linked reporter', async () => {
    const doc = fakeFeedback();
    Feedback.findById = async () => doc;
    User.findById = () => ({ select: async () => ({ name: 'Ghufran', email: 'ghufran@test.com' }) });
    const sent = [];
    const res = await run(resolveFeedbackHandler(async (args) => { sent.push(args); return true; }), { params: { id: 'fb1' } });
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.status, 'resolved');
    assert.ok(res.body.resolvedAt);
    assert.equal(res.body.emailSent, true);
    assert.equal(doc.saved, true);
    assert.equal(sent.length, 1);
    assert.equal(sent[0].to, 'ghufran@test.com');
    assert.equal(sent[0].category, 'Bug');
    assert.equal(sent[0].page, '/dashboard');
  });

  it('second resolve is idempotent — no second email, no re-save', async () => {
    const doc = fakeFeedback({ status: 'resolved', resolvedAt: new Date() });
    Feedback.findById = async () => doc;
    let mailed = 0;
    const res = await run(resolveFeedbackHandler(async () => { mailed += 1; return true; }), { params: { id: 'fb1' } });
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.emailSent, false);
    assert.equal(mailed, 0);
    assert.equal(doc.saved, false);
  });

  it('anonymous feedback resolves without email', async () => {
    const doc = fakeFeedback({ user: null });
    Feedback.findById = async () => doc;
    let mailed = 0;
    const res = await run(resolveFeedbackHandler(async () => { mailed += 1; return true; }), { params: { id: 'fb1' } });
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.status, 'resolved');
    assert.equal(res.body.emailSent, false);
    assert.equal(mailed, 0);
  });

  it('reporter without an email resolves without email', async () => {
    const doc = fakeFeedback();
    Feedback.findById = async () => doc;
    User.findById = () => ({ select: async () => ({ name: 'Ghufran', email: null }) });
    let mailed = 0;
    const res = await run(resolveFeedbackHandler(async () => { mailed += 1; return true; }), { params: { id: 'fb1' } });
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.emailSent, false);
    assert.equal(mailed, 0);
  });

  it('unknown id gets 404', async () => {
    Feedback.findById = async () => null;
    const res = await run(resolveFeedbackHandler(async () => true), { params: { id: 'nope' } });
    assert.equal(res.statusCode, 404);
  });
});

describe('resolve is admin-only — isAdmin', () => {
  it('non-admin gets 403', () => {
    const res = mockRes();
    let nextCalled = false;
    isAdmin({ user: { isAdmin: false } }, res, () => { nextCalled = true; });
    assert.equal(res.statusCode, 403);
    assert.equal(nextCalled, false);
  });

  it('no user gets 403', () => {
    const res = mockRes();
    let nextCalled = false;
    isAdmin({}, res, () => { nextCalled = true; });
    assert.equal(res.statusCode, 403);
    assert.equal(nextCalled, false);
  });
});

describe('sendFeedbackThanksEmail — no mail config, no send', () => {
  it('returns false without calling the mail API when env is unset', async () => {
    const savedKey = process.env.RESEND_API_KEY;
    const savedFrom = process.env.EMAIL_FROM;
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
    try {
      assert.equal(await sendFeedbackThanksEmail({ to: 'a@b.com', name: 'A', category: 'Bug', page: '/dashboard' }), false);
    } finally {
      if (savedKey !== undefined) process.env.RESEND_API_KEY = savedKey;
      if (savedFrom !== undefined) process.env.EMAIL_FROM = savedFrom;
    }
  });
});
