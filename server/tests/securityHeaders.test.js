import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { THEME_SCRIPT_SHA256, cspDirectives, readThemeScriptHash } from '../utils/securityHeaders.js';

// Helmet CSP must stay in sync with the app: if the inline theme script in
// client/index.html changes without a hash update, the script gets blocked.
describe('CSP (securityHeaders)', () => {
  it('theme-script hash matches client/index.html', () => {
    assert.equal(THEME_SCRIPT_SHA256, readThemeScriptHash());
  });

  it('script-src uses the hash, never unsafe-inline', () => {
    assert.ok(cspDirectives.scriptSrc.includes(`'sha256-${THEME_SCRIPT_SHA256}'`));
    assert.ok(!cspDirectives.scriptSrc.includes("'unsafe-inline'"));
  });

  it('allows Google Fonts (stylesheets + font files)', () => {
    assert.ok(cspDirectives.styleSrc.includes('https://fonts.googleapis.com'));
    assert.ok(cspDirectives.fontSrc.includes('https://fonts.gstatic.com'));
  });

  it('locks down framing, objects and base URI', () => {
    assert.deepEqual(cspDirectives.frameAncestors, ["'none'"]);
    assert.deepEqual(cspDirectives.objectSrc, ["'none'"]);
    assert.deepEqual(cspDirectives.baseUri, ["'self'"]);
  });
});
