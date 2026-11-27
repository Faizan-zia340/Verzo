import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateSchema, registerSchema, tuneSchema, missingRequiredFields, ALLOWED_SUBTYPES } from '../utils/validators.js';

const valid = (overrides = {}) => ({
  type: 'blog',
  prompt: 'Write about drinking more water every day, please.',
  topic: 'Water',
  audience: 'Everyone',
  ...overrides,
});

describe('generateSchema — new types', () => {
  it('accepts a cover letter with all required fields', () => {
    const { error } = generateSchema.validate(valid({
      type: 'cover_letter',
      company: 'Acme Corp', role: 'Frontend Developer', location: 'Toronto',
      senderName: 'Faizan Zia', skills: 'React, TypeScript',
    }));
    assert.equal(error, undefined);
  });

  it('rejects a cover letter missing skills', () => {
    const { error } = generateSchema.validate(valid({
      type: 'cover_letter',
      company: 'Acme Corp', role: 'Frontend Developer', location: 'Toronto',
      senderName: 'Faizan Zia',
    }));
    assert.match(error.message, /Key skills/);
  });

  it('accepts a resume summary with role and skills', () => {
    const { error } = generateSchema.validate(valid({
      type: 'resume_summary', role: 'Designer', skills: 'Figma, UX research',
    }));
    assert.equal(error, undefined);
  });

  it('accepts linkedin with topic and audience', () => {
    const { error } = generateSchema.validate(valid({
      type: 'linkedin', topic: 'Launching a product', audience: 'Founders',
    }));
    assert.equal(error, undefined);
  });

  it('rejects an unknown type', () => {
    const { error } = generateSchema.validate(valid({ type: 'poem' }));
    assert.ok(error);
  });

  it('keeps subtype in the validated value', () => {
    const { value } = generateSchema.validate(valid({ type: 'email', subtype: 'cold_outreach' }));
    assert.equal(value.subtype, 'cold_outreach');
  });

  it('keeps the skills detail field', () => {
    const { value } = generateSchema.validate(valid({
      type: 'cover_letter',
      company: 'Acme', role: 'Dev', location: 'Toronto',
      senderName: 'FZ', skills: 'React',
    }));
    assert.equal(value.skills, 'React');
  });
});

describe('missingRequiredFields', () => {
  it('lists missing fields for cover_letter', () => {
    assert.deepEqual(
      missingRequiredFields('cover_letter', { company: 'Acme' }),
      ['Role (job title)', 'Location', 'Sender name', 'Key skills']
    );
  });

  it('returns [] when all required fields are present', () => {
    assert.deepEqual(
      missingRequiredFields('linkedin', { topic: 'x', audience: 'y' }),
      []
    );
  });
});

describe('ALLOWED_SUBTYPES', () => {
  it('lists the email categories', () => {
    assert.deepEqual(ALLOWED_SUBTYPES.email, [
      'general', 'cold_outreach', 'follow_up', 'newsletter', 'welcome',
      'apology', 'job_application', 'thank_you', 'meeting_request',
    ]);
  });

  it('lists the social styles', () => {
    assert.deepEqual(ALLOWED_SUBTYPES.social, ['post', 'captions']);
  });
});

describe('registerSchema — disposable email blocklist', () => {
  const valid = (overrides = {}) => ({
    name: 'Faizan', email: 'faizan@gmail.com', password: 'secret123', ...overrides,
  });

  it('accepts a normal permanent email (gmail)', () => {
    const { error } = registerSchema.validate(valid());
    assert.equal(error, undefined);
  });

  it('rejects a disposable domain (mailinator)', () => {
    const { error } = registerSchema.validate(valid({ email: 'user@mailinator.com' }));
    assert.ok(error);
    assert.match(error.message, /permanent email/i);
  });

  it('rejects other disposable providers (yopmail, guerrillamail, temp-mail)', () => {
    for (const email of ['a@yopmail.com', 'a@guerrillamail.com', 'a@temp-mail.org', 'a@10minutemail.com']) {
      const { error } = registerSchema.validate(valid({ email }));
      assert.ok(error, email);
      assert.match(error.message, /permanent email/i);
    }
  });

  it('still rejects a malformed email', () => {
    const { error } = registerSchema.validate(valid({ email: 'not-an-email' }));
    assert.ok(error);
  });
});

describe('tuneSchema — 5000 char cap + fixed actions', () => {
  it('accepts a short text with a valid action', () => {
    const { error } = tuneSchema.validate({ text: 'Make this better.', action: 'engaging' });
    assert.equal(error, undefined);
  });

  it('accepts exactly 5000 characters', () => {
    const { error } = tuneSchema.validate({ text: 'x'.repeat(5000), action: 'shorten' });
    assert.equal(error, undefined);
  });

  it('rejects text over 5000 characters', () => {
    const { error } = tuneSchema.validate({ text: 'x'.repeat(5001), action: 'shorten' });
    assert.ok(error);
    assert.match(error.message, /5000/);
  });

  it('rejects an unknown action', () => {
    const { error } = tuneSchema.validate({ text: 'Hello.', action: 'rewrite' });
    assert.ok(error);
  });

  it('rejects a missing text', () => {
    const { error } = tuneSchema.validate({ action: 'shorten' });
    assert.ok(error);
  });
});
