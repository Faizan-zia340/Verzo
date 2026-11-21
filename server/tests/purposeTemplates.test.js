// Unit tests for purpose templates + human-style generation.
// Run with: npm test   (node --test server/tests/)
// Pure modules only — no AI calls, no MongoDB, no network.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CONTENT_TYPES, TONES, getPurpose, listPurposes, getPurposeFields } from '../config/contentTypes.js';
import { missingRequiredFields, generateSchema } from '../utils/validators.js';
import { buildPrompt, buildEditorPrompt } from '../utils/prompts.js';
import { checkQuality } from '../utils/qualityCheck.js';
import { runEditorPass, runTwoPassDraft, wordCount } from '../utils/twoPass.js';

const longText = (n) => Array.from({ length: n }, (_, i) => `Sentence number ${i} with some real content here.`).join(' ');

// ── Purpose config ──────────────────────────────────────────────
test('contentTypes: every type has purposes with the full shape', () => {
  assert.deepEqual(Object.keys(CONTENT_TYPES).sort(), ['ad', 'blog', 'email', 'product', 'social']);
  let total = 0;
  for (const [type, config] of Object.entries(CONTENT_TYPES)) {
    for (const [id, p] of Object.entries(config.purposes)) {
      total += 1;
      assert.ok(p.label, `${type}/${id} needs a label`);
      assert.ok(Array.isArray(p.requiredFields) && p.requiredFields.length > 0, `${type}/${id} needs required fields`);
      assert.ok(p.requiredFields.every((f) => f.key && f.label), `${type}/${id} fields need key+label`);
      assert.ok(typeof p.structure === 'string' && p.structure.length > 20, `${type}/${id} needs a structure outline`);
      assert.ok(TONES.includes(p.defaultTone), `${type}/${id} default tone must be a known tone`);
      assert.ok(p.lengthRange.min > 0 && p.lengthRange.max > p.lengthRange.min, `${type}/${id} needs a valid length range`);
      assert.equal(p.examples.length, 2, `${type}/${id} needs exactly 2 examples`);
      assert.ok(p.examples.every((e) => typeof e === 'string' && e.length > 20), `${type}/${id} examples must be real text`);
    }
  }
  assert.equal(total, 26, 'expected 26 purposes in total');
});

test('contentTypes: email has 10 purposes, blog 5, social 5, ad 3, product 3', () => {
  assert.equal(listPurposes('email').length, 10);
  assert.equal(listPurposes('blog').length, 5);
  assert.equal(listPurposes('social').length, 5);
  assert.equal(listPurposes('ad').length, 3);
  assert.equal(listPurposes('product').length, 3);
});

test('contentTypes: getPurpose returns null for unknown purpose', () => {
  assert.equal(getPurpose('email', 'nope'), null);
  assert.equal(getPurpose('nope', 'cold-outreach'), null);
  assert.equal(getPurpose('email', 'cold-outreach').label, 'Cold outreach');
  assert.deepEqual(getPurposeFields('email', 'thank-you').map((f) => f.key), ['senderName', 'recipient', 'topic']);
});

// ── Validators ──────────────────────────────────────────────────
test('validators: purpose required fields are enforced', () => {
  const missing = missingRequiredFields('email', { company: 'Acme', senderName: 'Faizan' }, 'job-posting');
  assert.deepEqual(missing.sort(), ['Apply link or contact', 'Location', 'Role'].sort());
  assert.deepEqual(missingRequiredFields('email', { senderName: 'Faizan', topic: 'Late delivery' }, 'thank-you'), ['Recipient']);
  assert.deepEqual(
    missingRequiredFields('email', { senderName: 'Faizan', recipient: 'Sara', topic: 'Thanks' }, 'thank-you'),
    []
  );
});

test('validators: no purpose falls back to per-type required fields', () => {
  assert.deepEqual(missingRequiredFields('email', { company: 'Acme' }), [
    'Role', 'Location', 'Sender name', 'Apply link or contact',
  ]);
  assert.deepEqual(missingRequiredFields('blog', { topic: 'X' }), ['Audience']);
});

test('validators: generateSchema accepts a full purpose body, rejects a missing one', () => {
  const ok = generateSchema.validate({
    type: 'email', prompt: 'Write a job post for a driver role in Lahore.',
    purpose: 'job-posting', company: 'Acme', role: 'Driver', location: 'Lahore',
    senderName: 'Faizan', applyLink: 'https://acme.com/jobs/1',
  });
  assert.equal(ok.error, undefined);

  const bad = generateSchema.validate({
    type: 'email', prompt: 'Write a thank-you note to a client.',
    purpose: 'thank-you', senderName: 'Faizan', topic: 'Help with launch',
  });
  assert.ok(bad.error, 'missing recipient must fail validation');
  assert.match(bad.error.details[0].message, /Recipient/);
});

test('validators: writingSample over 1500 chars is rejected', () => {
  const { error } = generateSchema.validate({
    type: 'blog', prompt: 'Write a how-to about sourdough for beginners.',
    topic: 'Sourdough', audience: 'Beginners', writingSample: 'x'.repeat(1501),
  });
  assert.ok(error);
});

// ── Prompts ─────────────────────────────────────────────────────
test('prompts: buildPrompt injects purpose structure and examples', () => {
  const prompt = buildPrompt({
    type: 'email', prompt: 'Hire a driver', purpose: 'job-posting',
    details: { company: 'Acme', role: 'Driver', location: 'Lahore', senderName: 'Faizan' },
  });
  assert.match(prompt, /Job posting/);
  assert.match(prompt, /how to apply/i);
  assert.match(prompt, /Example 1/);
  assert.match(prompt, /Example 2/);
  assert.match(prompt, /Acme/);
});

test('prompts: tone and reading level are injected', () => {
  const prompt = buildPrompt({ type: 'blog', prompt: 'Sourdough basics', tone: 'urgent', readingLevel: 'simple' });
  assert.match(prompt, /urgent/i);
  assert.match(prompt, /simple reading level/i);
});

test('prompts: writingSample is matched for voice, not copied', () => {
  const sample = 'I write short. Very short. Then a long one follows, because rhythm matters.';
  const prompt = buildPrompt({ type: 'blog', prompt: 'Sourdough basics', writingSample: sample });
  assert.match(prompt, /match this voice only/);
  assert.ok(prompt.includes(sample));
  assert.match(prompt, /Do NOT copy its words/);
});

test('prompts: buildEditorPrompt preserves facts and forbids placeholders', () => {
  const editor = buildEditorPrompt('We launched on 1 December in Lahore.', { type: 'email', purpose: 'announcement' });
  assert.match(editor, /Preserve EVERY fact/);
  assert.match(editor, /Never insert placeholders/);
  assert.match(editor, /Announcement/);
});

// ── Quality checks ──────────────────────────────────────────────
const cleanEmail = (overrides = {}) => {
  const base = `Subject: Driver role in Lahore
Hi Sara,
We are hiring a driver in Lahore. The route is fixed and fuel is paid. Apply at https://acme.com/jobs/1.
Best regards,
Faizan`;
  return base;
};

test('qualityCheck: Google ad headline over 30 chars is flagged', () => {
  const result = checkQuality('This headline is definitely way too long for Google\nShort desc here.', { type: 'ad', purpose: 'google-search', length: 'short' });
  assert.ok(result.issues.some((i) => i.includes('headline')), result.issues.join(' | '));
});

test('qualityCheck: Google ad within limits passes the ad check', () => {
  const result = checkQuality('Cheap Flights Dubai\nDirect flights from Lahore. Book today.', { type: 'ad', purpose: 'google-search', length: 'short' });
  assert.ok(!result.issues.some((i) => i.includes('Google ad')), result.issues.join(' | '));
});

test('qualityCheck: X post over 280 chars is flagged', () => {
  const result = checkQuality('x'.repeat(281), { type: 'social', purpose: 'x-twitter', length: 'short' });
  assert.ok(result.issues.some((i) => i.includes('280')), result.issues.join(' | '));
});

test('qualityCheck: email purpose missing subject/greeting/sign-off is flagged', () => {
  const result = checkQuality('We are hiring a driver in Lahore. Apply now at https://acme.com/jobs/1. The route is fixed and fuel is paid. We reply within three days. Faizan Zia is the hiring manager. The start date is Monday next week. Bring your licence on the first day.', {
    type: 'email', purpose: 'cold-outreach',
    input: { senderName: 'Faizan Zia', applyLink: 'https://acme.com/jobs/1' },
    length: 'short',
  });
  assert.ok(result.issues.some((i) => i.includes('subject')), result.issues.join(' | '));
  assert.ok(result.issues.some((i) => i.includes('greeting')), result.issues.join(' | '));
  assert.ok(result.issues.some((i) => i.includes('sign-off')), result.issues.join(' | '));
});

test('qualityCheck: well-formed purpose email passes the structure checks', () => {
  const result = checkQuality(cleanEmail(), {
    type: 'email', purpose: 'job-posting',
    input: { senderName: 'Faizan', applyLink: 'https://acme.com/jobs/1' },
    length: 'short',
  });
  assert.ok(!result.issues.some((i) => /subject|greeting|sign-off/i.test(i)), result.issues.join(' | '));
});

test('qualityCheck: 3 consecutive sentences starting the same way are flagged', () => {
  const text = 'We launched the app in March. We added dark mode in April. We shipped offline drafts in May. The team worked hard all spring and the users noticed the difference every single week.';
  const result = checkQuality(text, { type: 'blog', length: 'short' });
  assert.ok(result.issues.some((i) => i.includes('Repetitive opening')), result.issues.join(' | '));
});

test('qualityCheck: varied sentence openings are not flagged', () => {
  const text = 'The bakery opens at 7 am every day. Fresh sourdough sells out by 10, so come early. On Fridays we also bake croissants, and the queue starts before the doors open.';
  const result = checkQuality(text, { type: 'blog', length: 'short' });
  assert.ok(!result.issues.some((i) => i.includes('Repetitive opening')), result.issues.join(' | '));
});

// ── Two-pass ────────────────────────────────────────────────────
test('twoPass: short drafts skip pass 2', async () => {
  let calls = 0;
  const generateFn = async () => { calls += 1; return 'Short draft.'; };
  const out = await runTwoPassDraft(generateFn, { type: 'blog', purpose: 'how-to' })('Write a short note');
  assert.equal(out, 'Short draft.');
  assert.equal(calls, 1, 'pass 2 must not run under 80 words');
});

test('twoPass: long drafts run the editor pass and keep its output', async () => {
  const draft = longText(90);
  const calls = [];
  const generateFn = async (prompt) => {
    calls.push(prompt);
    return prompt.includes('careful human editor') ? 'Edited version, much better.' : draft;
  };
  const out = await runTwoPassDraft(generateFn, { type: 'blog', purpose: 'how-to' })('Write a guide');
  assert.equal(out, 'Edited version, much better.');
  assert.equal(calls.length, 2);
  assert.match(calls[1], /Preserve EVERY fact/);
});

test('twoPass: editor failure keeps the original draft', async () => {
  const draft = longText(90);
  const generateFn = async (prompt) => {
    if (prompt.includes('careful human editor')) throw new Error('model overloaded');
    return draft;
  };
  const out = await runEditorPass(generateFn, draft, { type: 'blog' });
  assert.equal(out, draft);
});

test('twoPass: wordCount counts words', () => {
  assert.equal(wordCount('one two three'), 3);
  assert.equal(wordCount(''), 0);
});
