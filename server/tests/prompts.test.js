import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildPrompt, LANGUAGE_MAP, LANGUAGE_NAMES, EMAIL_SUBTYPES } from '../utils/prompts.js';

const base = { type: 'blog', prompt: 'drinking more water every day', tone: 'friendly' };

describe('language instructions', () => {
  it('every language has a non-empty instruction (no silent fallback)', () => {
    for (const [key, instruction] of Object.entries(LANGUAGE_MAP)) {
      assert.ok(instruction && instruction.trim().length > 0, `${key} has an empty instruction`);
    }
  });

  it('every language has a display name for the top anchor', () => {
    for (const key of Object.keys(LANGUAGE_MAP)) {
      assert.ok(LANGUAGE_NAMES[key], `${key} is missing from LANGUAGE_NAMES`);
    }
  });

  it('english_us explicitly asks for American English', () => {
    assert.match(LANGUAGE_MAP.english_us, /American English/);
    assert.match(LANGUAGE_MAP.english_us, /US spelling/);
  });

  it('the language anchor is at the very top of the prompt', () => {
    const prompt = buildPrompt({ ...base, language: 'english_us' });
    assert.ok(prompt.startsWith('OUTPUT LANGUAGE — CRITICAL: Write the ENTIRE response in American English.'));
  });

  it('a prompt written in another language still anchors the selected output language', () => {
    // User types the prompt in Roman Urdu but wants English output.
    const prompt = buildPrompt({ ...base, prompt: 'rozana zyada paani peene ke fayde', language: 'english_us' });
    assert.ok(prompt.startsWith('OUTPUT LANGUAGE — CRITICAL: Write the ENTIRE response in American English.'));
    assert.match(prompt, /American English/);
  });

  it('roman urdu anchor names Roman Urdu, not English', () => {
    const prompt = buildPrompt({ ...base, language: 'roman_urdu_karachi' });
    assert.ok(prompt.startsWith('OUTPUT LANGUAGE — CRITICAL: Write the ENTIRE response in Roman Urdu (Karachi street style).'));
  });

  it('unknown language falls back to American English', () => {
    const prompt = buildPrompt({ ...base, language: 'klingon' });
    assert.ok(prompt.startsWith('OUTPUT LANGUAGE — CRITICAL: Write the ENTIRE response in American English.'));
  });
});

describe('email subtypes', () => {
  it('cold outreach and newsletter prompts are different', () => {
    const cold = buildPrompt({ ...base, type: 'email', subtype: 'cold_outreach' });
    const news = buildPrompt({ ...base, type: 'email', subtype: 'newsletter' });
    assert.notEqual(cold, news);
    assert.match(cold, /COLD OUTREACH/);
    assert.match(news, /NEWSLETTER/);
  });

  it('unknown email subtype falls back to the general structure', () => {
    const prompt = buildPrompt({ ...base, type: 'email', subtype: 'nonsense' });
    assert.match(prompt, /subject line, greeting, body/);
  });

  it('subtype passed inside details still applies', () => {
    const prompt = buildPrompt({ ...base, type: 'email', details: { subtype: 'apology' } });
    assert.match(prompt, /APOLOGY/);
  });

  it('all documented email subtypes exist', () => {
    for (const key of ['general', 'cold_outreach', 'follow_up', 'newsletter', 'welcome', 'apology', 'job_application', 'thank_you', 'meeting_request']) {
      assert.ok(EMAIL_SUBTYPES[key], `missing email subtype ${key}`);
    }
  });
});

describe('new content types', () => {
  it('cover letter template uses the provided details and never invents experience', () => {
    const prompt = buildPrompt({
      ...base,
      type: 'cover_letter',
      details: { company: 'Acme Corp', role: 'Frontend Developer', senderName: 'Faizan Zia', skills: 'React, TypeScript' },
    });
    assert.match(prompt, /cover letter/i);
    assert.match(prompt, /Acme Corp/);
    assert.match(prompt, /React, TypeScript/);
    assert.match(prompt, /never invent experience/);
  });

  it('resume summary template is short (60-90 words)', () => {
    const prompt = buildPrompt({ ...base, type: 'resume_summary', details: { role: 'Designer', skills: 'Figma' } });
    assert.match(prompt, /60-90 words/);
  });

  it('linkedin template asks for hashtags', () => {
    const prompt = buildPrompt({ ...base, type: 'linkedin' });
    assert.match(prompt, /LinkedIn post/);
    assert.match(prompt, /hashtags/);
  });

  it('social captions subtype returns 3 caption options', () => {
    const prompt = buildPrompt({ ...base, type: 'social', subtype: 'captions' });
    assert.match(prompt, /3 short caption options/);
  });
});
