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

/**
 * Check generated text for unfinished / low-quality output.
 * @param {string} text - the generated output (raw; reality-check section is ignored)
 * @param {{ type?: string, input?: object, length?: string }} opts
 *   type: content type ('blog' | 'social' | 'email' | 'ad' | 'product')
 *   input: the user's original request body (used to verify required details appear)
 *   length: requested length ('short' | 'medium' | 'long')
 * @returns {{ passed: boolean, issues: string[] }}
 */
export const checkQuality = (text, { type, input = {}, length = 'medium' } = {}) => {
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

  return { passed: issues.length === 0, issues };
};

/**
 * Regenerate ONCE with the quality issues appended as feedback.
 * `generateFn` is an async function (prompt) => raw generated text.
 * Returns the best attempt (fewest issues) plus a qualityReport.
 */
export const retryGeneration = async (
  generateFn,
  { prompt, firstText, firstReport, type, input = {}, length = 'medium' }
) => {
  const retryPrompt = `${prompt}\n\nIMPORTANT — fix these problems in your previous draft and regenerate the full content, corrected. Do not repeat them:\nFix these problems: ${firstReport.issues.join('; ')}`;
  const secondText = await generateFn(retryPrompt);
  const secondReport = checkQuality(secondText, { type, input, length });
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
  { prompt, type, input = {}, length = 'medium' }
) => {
  const firstText = await generateFn(prompt);
  const firstReport = checkQuality(firstText, { type, input, length });
  if (firstReport.passed) {
    return { text: firstText, qualityReport: { passed: true, issues: [], retried: false } };
  }
  return retryGeneration(generateFn, { prompt, firstText, firstReport, type, input, length });
};
