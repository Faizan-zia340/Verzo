import getClient, { MODEL, API_VERSION } from '../config/gemini.js';
import { buildSEOPrompt, buildTunePrompt } from './prompts.js';
import { mapProviderError } from './quotaMessages.js';
import logger from './logger.js';

const REQUEST_OPTIONS = { apiVersion: API_VERSION };

const SYSTEM_MESSAGE = `Act as a Dual-Agent System:
Agent 1: Expert Copywriter (Creates high-converting, human-like content).
Agent 2: Brutal AI Reviewer (Rates content based on GPT-4, Claude 3.5, Meta Llama 3, and Gemini 1.5 Pro standards).

STRICT RULES FOR GENERATION:
- No AI clichés (unleash, stunning, tapestry, revolutionize, elevate, dive into, etc.).
- Problem-first: open by addressing a real pain point, not the product.
- Use short, punchy sentences. Mix lengths for natural rhythm.
- Tone matters: Persuasive = psychological triggers. Friendly = helpful neighbor, not corporate robot.
- Follow the output-language instruction in the prompt exactly: write the ENTIRE response in that language/dialect and no other. Never switch languages mid-response, and never favour one language over another.
- Never print role labels such as "Agent 1" or "Agent 2" anywhere in your output — those are internal roles, not content.
- Strictly follow the requested format (Headings / Bullets / Paragraphs).
- Output ONLY the content first. No "Here is your content" filler.

STRICT RULES FOR EVALUATION:
After the content, always append a "REALITY CHECK" section in this exact format:

---
**REALITY CHECK**
| Pillar | Score /10 | Verdict |
|---|---|---|
| Human-ness | X | (Does it sound like a robot?) |
| Punchiness | X | (Is it boring or engaging?) |
| No-Cliché Score | X | (Did it avoid 'AI words'?) |

**Estimated Global AI Rating:** X/10
*(Average score expected from GPT-4, Claude 3.5, Meta Llama 3, and Gemini 1.5 Pro)*`;

const geminiError = (err) => {
  const msg = err.message || '';
  // Provider detail stays in the server log only — the thrown error is
  // always a Penlix-branded message safe to show to users.
  logger.error({ msg: msg.slice(0, 200) }, 'AI provider error');
  const mapped = mapProviderError(err);
  const e = new Error(mapped.message);
  e.statusCode = mapped.status;
  if (mapped.retryAfter) e.retryAfter = mapped.retryAfter;
  throw e;
};

const getModel = () => {
  const genAI = getClient();
  return genAI.getGenerativeModel({ model: MODEL }, REQUEST_OPTIONS);
};

const withSystem = (prompt) => `${SYSTEM_MESSAGE}\n\n---\n\n${prompt}`;

export const generateText = async (prompt) => {
  try {
    const model = getModel();
    const result = await model.generateContent(withSystem(prompt));
    return result.response.text();
  } catch (err) {
    geminiError(err);
  }
};

// Text generation grounded in a user-uploaded image. gemini-2.5-flash-lite
// accepts inline image data (same mechanism imageService.js already uses
// for Unsplash analysis). The image bytes are used for this one call only
// and are never stored.
export const generateWithImage = async (prompt, { data, mimeType }) => {
  try {
    const model = getModel();
    const result = await model.generateContent([
      { inlineData: { data, mimeType } },
      { text: withSystem(`${prompt}\n\nThe image above is the subject of this request. Describe or use ONLY what is actually visible in it — never invent details that are not in the image.`) },
    ]);
    return result.response.text();
  } catch (err) {
    geminiError(err);
  }
};

export const generateSEO = async (content) => {
  // The model returns free-form JSON — validate its shape before callers
  // trust it; anything invalid falls back to empty SEO, never a throw.
  const fallback = { title: '', description: '', keywords: [] };
  try {
    const model = getModel();
    const result = await model.generateContent(buildSEOPrompt(content));
    const raw = result.response.text().trim().replace(/```json|```/g, '').trim();
    const seo = JSON.parse(raw);
    if (!seo || typeof seo !== 'object' || Array.isArray(seo)) return fallback;
    if (typeof seo.title !== 'string' || seo.title.length > 60) return fallback;
    if (typeof seo.description !== 'string' || seo.description.length > 160) return fallback;
    if (!Array.isArray(seo.keywords) || !seo.keywords.every((k) => typeof k === 'string')) return fallback;
    if (seo.imageKeywords !== undefined && (!Array.isArray(seo.imageKeywords) || !seo.imageKeywords.every((k) => typeof k === 'string'))) return fallback;
    return seo;
  } catch {
    return fallback;
  }
};

export const tuneText = async (text, action) => {
  try {
    const model = getModel();
    const result = await model.generateContent(withSystem(buildTunePrompt(text, action)));
    return result.response.text();
  } catch (err) {
    geminiError(err);
  }
};

export { geminiError, getModel, withSystem, SYSTEM_MESSAGE };
