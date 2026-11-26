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
- For Roman Urdu, use natural, conversational street-style Pakistani Urdu (Karachi/Lahore style — use 'masla', 'hal', 'dhamaal', etc.).
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

export const generateSEO = async (content) => {
  try {
    const model = getModel();
    const result = await model.generateContent(buildSEOPrompt(content));
    const raw = result.response.text().trim().replace(/```json|```/g, '').trim();
    return JSON.parse(raw);
  } catch {
    return { title: '', description: '', keywords: [] };
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
