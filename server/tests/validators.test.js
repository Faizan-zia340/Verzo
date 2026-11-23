import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateSchema, missingRequiredFields, ALLOWED_SUBTYPES } from '../utils/validators.js';

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
