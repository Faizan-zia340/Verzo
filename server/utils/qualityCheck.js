// Post-generation quality checker for AI-generated content.
// Pure functions — no I/O, no AI calls — so they are easy to unit test.

export const BANNED_PHRASES = [
  'passionate',
  'push boundaries',
  'we get it',
  "in today's fast-paced world",
  'unlock your potential',
  'game-changer',
  'your calling',
  'delve',
  'seamless',
  'cutting-edge',
];

// Google search ad character limits (headline 30, description 90).
export const GOOGLE_AD_LIMITS = { headline: 30, description: 90 };
// X / Twitter post character limit.
export const X_CHAR_LIMIT = 280;

// Email purposes that must have a subject line, a greeting and a sign-off.
// Newsletters and announcements are exempt (they often have neither).
const EMAIL_STRUCTURE_PURPOSES = new Set([
  'cold-outreach',
  'follow-up',
  'job-posting',
  'complaint',
  'apology',
  'payment-reminder',
  'thank-you',
  'meeting-request',
]);

const SIGN_OFF_PATTERNS = /\b(best regards|kind regards|warm regards|regards|sincerely|thank you|thanks|best|cheers)\b[,.!]?[\s\S]{0,80}$/i;
const GREETING_PATTERNS = /^(hi|hello|hey|dear|good (morning|afternoon|evening))\b/im;

// Placeholders the AI must never leave in finished content.
// The bracket pattern skips markdown links such as [Apply here](https://...).
const PLACEHOLDER_PATTERNS = [
  { pattern: /\[[^\]]+\]/g, label: 'bracket placeholder' },
  { pattern: /\{\{[^}]*\}\}/g, label: 'template placeholder' },
  { pattern: /<[A-Z][A-Z _]{2,}>/g, label: 'angle-bracket placeholder' },
  { pattern: /\bYour Name\b/g, label: '"Your Name"' },
  { pattern: /\bLorem ipsum\b/gi, label: '"Lorem ipsum"' },
  { pattern: /\binsert here\b/gi, label: '"insert here"' },
];

// Expected word counts per requested length. `social` is a short post,
// so it has its own range instead of the short/medium/long blog ranges.
const EXPECTED_WORDS = {
  short: { min: 100, max: 150 },
  medium: { min: 200, max: 300 },
  long: { min: 400, max: 600 },
  social: { min: 15, max: 80 },
};

// The generated text before the "REALITY CHECK" section (and any inline
// [IMAGE:N] markers) is the content the user sees — that is what we check.
const visibleBody = (text) => {
  const clean = String(text || '').replace(/\[IMAGE:\d+\]/g, '');
  return clean.split(/\n*-{3,}\s*\n\*\*REALITY CHECK\*\*/)[0].trim();
};

const splitSentences = (body) =>
  body
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.replace(/^[•\-*]\s*/, '').trim())
    .filter(Boolean);

// First meaningful word of a sentence, lowercased, punctuation stripped.
const sentenceStart = (sentence) => {
  const word = sentence.split(/\s+/)[0] || '';
  return word.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '').toLowerCase();
};

/**
 * Check generated text for unfinished / low-quality output.
 * @param {string} text - the generated output (raw; reality-check section is ignored)
 * @param {{ type?: string, purpose?: string, input?: object, length?: string }} opts
 *   type: content type ('blog' | 'social' | 'email' | 'ad' | 'product')
 *   purpose: purpose sub-type id (e.g. 'google-search', 'x-twitter')
 *   input: the user's original request body (used to verify required details appear)
 *   length: requested length ('short' | 'medium' | 'long')
 * @returns {{ passed: boolean, issues: string[] }}
 */
export const checkQuality = (text, { type, purpose = '', input = {}, length = 'medium' } = {}) => {
  const issues = [];
  const body = visibleBody(text);
  if (!body) return { passed: false, issues: ['Output was empty.'] };

  // 1. Placeholders left in the output
  const seenPlaceholders = new Set();
  for (const { pattern } of PLACEHOLDER_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
    let match;
    while ((match = re.exec(body)) !== null) {
      // A bracketed phrase followed by (url) is a markdown link, not a placeholder.
      if (match[0].startsWith('[') && body.slice(match.index + match[0].length).startsWith('(')) continue;
      seenPlaceholders.add(match[0]);
    }
  }
  for (const placeholder of seenPlaceholders) {
    issues.push(`Contains placeholder text: "${placeholder}"`);
  }

  // 2. Banned generic / buzzword phrases (case-insensitive)
  const lower = body.toLowerCase();
  for (const phrase of BANNED_PHRASES) {
    if (lower.includes(phrase.toLowerCase())) {
      issues.push(`Contains banned phrase: "${phrase}"`);
    }
  }

  // 3. Opening filler — the first sentence is a rhetorical question
  const firstSentence = (body.split(/(?<=[.!?])\s+/)[0] || body).trim();
  if (/\?\s*$/.test(firstSentence)) {
    const preview = firstSentence.length > 80 ? `${firstSentence.slice(0, 80)}…` : firstSentence;
    issues.push(`Opens with a rhetorical question ("${preview}"). Start with a concrete statement instead.`);
  }

  // 4. Email / job-post: the apply link/contact and sender name must appear
  if (type === 'email') {
    const applyValue = String(input.applyLink || input.contact || '').trim();
    if (applyValue && !lower.includes(applyValue.toLowerCase())) {
      issues.push(`Output is missing the apply link/contact: "${applyValue}"`);
    }
    const sender = String(input.senderName || '').trim();
    if (sender && !lower.includes(sender.toLowerCase())) {
      issues.push(`Output is missing the sender name: "${sender}"`);
    }
  }

  // 5. Length — flag if more than 30% off the requested range
  const words = body.split(/\s+/).filter(Boolean).length;
  const expected = type === 'social' ? EXPECTED_WORDS.social : EXPECTED_WORDS[length] || EXPECTED_WORDS.medium;
  const low = Math.floor(expected.min * 0.7);
  const high = Math.ceil(expected.max * 1.3);
  if (words < low || words > high) {
    issues.push(
      `Length is ${words} words, expected about ${expected.min}-${expected.max} words (more than 30% off).`
    );
  }

  // 6. Per-purpose checks
  if (purpose === 'google-search') {
    const lines = body.split('\n').map((l) => l.trim()).filter(Boolean);
    const headline = lines[0] || '';
    if (headline.length > GOOGLE_AD_LIMITS.headline) {
      issues.push(`Google ad headline is ${headline.length} characters (limit ${GOOGLE_AD_LIMITS.headline}).`);
    }
    for (const line of lines.slice(1)) {
      if (line.length > GOOGLE_AD_LIMITS.description) {
        issues.push(`Google ad description line is ${line.length} characters (limit ${GOOGLE_AD_LIMITS.description}).`);
        break;
      }
    }
  }

  if (purpose === 'x-twitter' && body.length > X_CHAR_LIMIT) {
    issues.push(`X post is ${body.length} characters (limit ${X_CHAR_LIMIT}).`);
  }

  if (type === 'email' && EMAIL_STRUCTURE_PURPOSES.has(purpose)) {
    if (!/^subject:/im.test(body)) {
      issues.push('Email is missing a subject line.');
    }
    if (!GREETING_PATTERNS.test(body)) {
      issues.push('Email is missing a greeting (Hi/Hello/Dear...).');
    }
    if (!SIGN_OFF_PATTERNS.test(body)) {
      issues.push('Email is missing a sign-off (Best regards / Thanks / etc.).');
    }
  }

  // 7. Repetition — 3 or more consecutive sentences starting the same way
  const sentences = splitSentences(body);
  let run = 1;
  for (let i = 1; i < sentences.length; i++) {
    const prev = sentenceStart(sentences[i - 1]);
    const cur = sentenceStart(sentences[i]);
    if (prev && prev === cur) {
      run += 1;
      if (run === 3) {
        issues.push(`Repetitive opening: ${run} consecutive sentences start with "${cur}". Vary the sentence openings.`);
      }
    } else {
      run = 1;
    }
  }

  return { passed: issues.length === 0, issues };
};

/**
 * Regenerate ONCE with the quality issues appended as feedback.
 * `generateFn` is an async function (prompt) => raw generated text.
 * Returns the best attempt (fewest issues) plus a qualityReport.
 */
export const retryGeneration = async (
  generateFn,
  { prompt, firstText, firstReport, type, input = {}, length = 'medium', purpose = '' }
) => {
  const retryPrompt = `${prompt}\n\nIMPORTANT — fix these problems in your previous draft and regenerate the full content, corrected. Do not repeat them:\nFix these problems: ${firstReport.issues.join('; ')}`;
  const secondText = await generateFn(retryPrompt);
  const secondReport = checkQuality(secondText, { type, purpose, input, length });
  if (secondReport.issues.length <= firstReport.issues.length) {
    return {
      text: secondText,
      qualityReport: { passed: secondReport.passed, issues: secondReport.issues, retried: true },
    };
  }
  return {
    text: firstText,
    qualityReport: { passed: firstReport.passed, issues: firstReport.issues, retried: true },
  };
};

/**
 * Generate text, quality-check it, and retry once if it fails.
 * Returns { text, qualityReport: { passed, issues, retried } }.
 * The caller saves / returns only `text` — never the failed first draft.
 */
export const generateWithQualityCheck = async (
  generateFn,
  { prompt, type, input = {}, length = 'medium', purpose = '' }
) => {
  const firstText = await generateFn(prompt);
  const firstReport = checkQuality(firstText, { type, purpose, input, length });
  if (firstReport.passed) {
    return { text: firstText, qualityReport: { passed: true, issues: [], retried: false } };
  }
  return retryGeneration(generateFn, { prompt, firstText, firstReport, type, input, length, purpose });
};
