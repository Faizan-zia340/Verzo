import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedOrigin } from '../utils/corsOrigins.js';
import { corsGuard } from '../middleware/corsGuard.js';

// Security fix C2: CORS must allow only the production frontend, local
// dev origins, and Vercel preview deployments of THIS project — never
// any *.vercel.app or *.replit.dev origin.
describe('isAllowedOrigin (C2)', () => {
  const ORIGINAL_CLIENT_URL = process.env.CLIENT_URL;

  before(() => {
    process.env.CLIENT_URL = 'https://verzo-ecru.vercel.app';
  });

  after(() => {
    if (ORIGINAL_CLIENT_URL === undefined) delete process.env.CLIENT_URL;
    else process.env.CLIENT_URL = ORIGINAL_CLIENT_URL;
  });

  it('allows the production frontend (CLIENT_URL)', () => {
    assert.equal(isAllowedOrigin('https://verzo-ecru.vercel.app'), true);
  });

  it('allows local dev origins', () => {
    assert.equal(isAllowedOrigin('http://localhost:5173'), true);
    assert.equal(isAllowedOrigin('http://localhost:5000'), true);
  });

  it('allows a Vercel preview deployment of this project', () => {
    assert.equal(isAllowedOrigin('https://verzo-git-feature-purpose-templates-faizan-zias-projects.vercel.app'), true);
    assert.equal(isAllowedOrigin('https://verzo-git-feature-admin-delete-user-faizan-zias-projects.vercel.app'), true);
  });

  it('rejects any other *.vercel.app origin', () => {
    assert.equal(isAllowedOrigin('https://evil.vercel.app'), false);
    assert.equal(isAllowedOrigin('https://verzo-git-x-evil.vercel.app'), false);
    assert.equal(isAllowedOrigin('https://verzo-git-feature-foo-other-team.vercel.app'), false);
  });

  it('rejects the stale .replit.dev origin', () => {
    assert.equal(isAllowedOrigin('https://verzo.replit.dev'), false);
  });

  it('rejects arbitrary origins', () => {
    assert.equal(isAllowedOrigin('https://evil.com'), false);
    assert.equal(isAllowedOrigin('https://verzo-ecru.vercel.app.evil.com'), false);
  });

  it('allows requests with no Origin (non-browser / server-to-server)', () => {
    assert.equal(isAllowedOrigin(undefined), true);
    assert.equal(isAllowedOrigin(''), true);
  });
});

// A disallowed Origin must get a clean 403, never a 500 (the cors
// middleware turns a callback Error into a 500 via the error handler).
describe('corsGuard (403, not 500)', () => {
  const ORIGINAL_CLIENT_URL = process.env.CLIENT_URL;

  before(() => {
    process.env.CLIENT_URL = 'https://verzo-ecru.vercel.app';
  });

  after(() => {
    if (ORIGINAL_CLIENT_URL === undefined) delete process.env.CLIENT_URL;
    else process.env.CLIENT_URL = ORIGINAL_CLIENT_URL;
  });

  const mockRes = () => {
    const res = { statusCode: null, body: null };
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (body) => { res.body = body; return res; };
    return res;
  };

  it('403s a disallowed origin with a Penlix message and never calls next', () => {
    const res = mockRes();
    let nextCalled = false;
    corsGuard({ headers: { origin: 'https://evil.com' } }, res, () => { nextCalled = true; });
    assert.equal(res.statusCode, 403);
    assert.match(res.body.message, /Penlix/);
    assert.equal(nextCalled, false);
  });

  it('lets an allowed origin through', () => {
    let nextCalled = false;
    corsGuard({ headers: { origin: 'https://verzo-ecru.vercel.app' } }, mockRes(), () => { nextCalled = true; });
    assert.equal(nextCalled, true);
  });

  it('lets requests without an Origin through', () => {
    let nextCalled = false;
    corsGuard({ headers: {} }, mockRes(), () => { nextCalled = true; });
    assert.equal(nextCalled, true);
  });
});
