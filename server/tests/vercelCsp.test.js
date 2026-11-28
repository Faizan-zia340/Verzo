import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { THEME_SCRIPT_SHA256, cspDirectives } from '../utils/securityHeaders.js';

// vercel.json must carry the same CSP as the Express server, or the live
// SPA (served by Vercel, not this server) is unprotected. If the inline
// theme script changes, update the hash in both securityHeaders.js and
// vercel.json — this test fails until both match.
const toKebab = (s) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const serialize = (directives) =>
  Object.entries(directives)
    .map(([k, v]) => (v.length ? `${toKebab(k)} ${v.join(' ')}` : toKebab(k)))
    .join('; ');

const vercel = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'vercel.json'), 'utf8')
);
const csp = vercel.headers
  .find((h) => h.source === '/(.*)')
  ?.headers.find((h) => h.key === 'Content-Security-Policy')?.value;

describe('vercel.json CSP', () => {
  it('carries the same policy as the server', () => {
    assert.equal(csp, serialize(cspDirectives));
  });

  it('allowlisted theme-script hash matches the server constant', () => {
    assert.ok(csp.includes(`'sha256-${THEME_SCRIPT_SHA256}'`));
  });
});
