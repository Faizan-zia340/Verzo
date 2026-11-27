// server/tests/disposableDomains.test.js
// Tests the disposable / temporary email blocklist (pure, no database).
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isDisposableEmail, DISPOSABLE_DOMAINS } from '../utils/disposableDomains.js';

describe('isDisposableEmail', () => {
  it('rejects the named disposable providers', () => {
    for (const domain of [
      'mailinator.com', 'guerrillamail.com', '10minutemail.com',
      'temp-mail.org', 'yopmail.com', 'sharklasers.com', 'getnada.com',
      'tempail.com', 'maildrop.cc', 'throwawaymail.com',
    ]) {
      assert.equal(isDisposableEmail(`someone@${domain}`), true, domain);
    }
  });

  it('rejects subdomains of a blocked provider', () => {
    assert.equal(isDisposableEmail('someone@sub.mailinator.com'), true);
    assert.equal(isDisposableEmail('someone@eu.yopmail.com'), true);
  });

  it('is case-insensitive', () => {
    assert.equal(isDisposableEmail('someone@MAILINATOR.COM'), true);
    assert.equal(isDisposableEmail('Someone@Mailinator.Com'), true);
  });

  it('accepts normal permanent domains', () => {
    for (const domain of ['gmail.com', 'outlook.com', 'yahoo.com', 'example.com', 'company.co.uk']) {
      assert.equal(isDisposableEmail(`someone@${domain}`), false, domain);
    }
  });

  it('does not flag addresses without a domain or non-strings', () => {
    assert.equal(isDisposableEmail('not-an-email'), false);
    assert.equal(isDisposableEmail(''), false);
    assert.equal(isDisposableEmail(null), false);
    assert.equal(isDisposableEmail(undefined), false);
  });

  it('does not flag a domain that merely contains a blocked name', () => {
    // mailinator.com.evil.com is not mailinator.com and not a subdomain of it.
    assert.equal(isDisposableEmail('someone@mailinator.com.evil.com'), false);
  });

  it('the blocklist is a non-empty set kept in one place', () => {
    assert.ok(DISPOSABLE_DOMAINS instanceof Set);
    assert.ok(DISPOSABLE_DOMAINS.size >= 20);
  });
});
