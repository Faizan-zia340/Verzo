// Two-pass generation helpers (pure — no I/O, no DB, no AI client).
// Pass 1 drafts, pass 2 is a short editor prompt that only removes robotic
// phrasing, repeated sentence patterns and filler while preserving facts.
// Credits are unaffected: the caller still deducts exactly 1 credit per
// generation, however many passes or retries ran.

import { buildEditorPrompt } from './prompts.js';
import { sanitizePlaceholders } from './qualityCheck.js';
import logger from './logger.js';

// Default true; set TWO_PASS_ENABLED=false to disable the editor pass.
export const TWO_PASS_ENABLED = process.env.TWO_PASS_ENABLED !== 'false';
export const TWO_PASS_MIN_WORDS = 80;

export const wordCount = (text) => String(text || '').split(/\s+/).filter(Boolean).length;

/**
 * Pass 2 (editor pass): polish a draft. Skipped when two-pass is disabled
 * or the draft is under 80 words. On any editor failure the original
 * draft is kept unchanged. The edited text is sanitized, so a bracketed
 * placeholder can never survive the editor pass into the saved output.
 */
export const runEditorPass = async (generateFn, text, { type, purpose = '' } = {}) => {
  if (!TWO_PASS_ENABLED || wordCount(text) < TWO_PASS_MIN_WORDS) return text;
  try {
    const edited = await generateFn(buildEditorPrompt(text, { type, purpose }));
    return edited && edited.trim() ? sanitizePlaceholders(edited.trim()) : text;
  } catch (err) {
    logger.error({ err: err.message }, 'Editor pass failed; keeping first draft');
    return text;
  }
};

/**
 * Full draft pipeline: pass 1 drafts, pass 2 edits. Use as the generateFn
 * for generateWithQualityCheck, so a quality retry re-runs both passes on
 * the corrected prompt. checkQuality always runs after pass 2.
 */
export const runTwoPassDraft = (generateFn, { type, purpose = '' }) => async (prompt) => {
  const draft = await generateFn(prompt);
  return runEditorPass(generateFn, draft, { type, purpose });
};
