import getClient, { MODEL, API_VERSION } from '../config/gemini.js';
import { buildSEOPrompt, buildTunePrompt } from './prompts.js';

const REQUEST_OPTIONS = { apiVersion: API_VERSION };

const SYSTEM_MESSAGE = `Act as a world-class Direct Response Copywriter and Content Strategist.
Your goal is to write content that doesn't sound like AI.

STRICT RULES:
1. NO CLICHÉS: Never use words like 'unleash', 'stunning', 'dive into', 'tapestry', 'revolutionize', or 'elevate'.
2. PROBLEM-FIRST: Start by addressing a specific pain point of the user.
3. BE PUNCHY: Use short, impactful sentences. Mix sentence lengths for a natural rhythm.
4. TONE MATTERS: If tone is 'Persuasive', use psychological triggers. If 'Friendly', sound like a helpful neighbor, not a corporate robot.
5. LANGUAGE: If 'Roman Urdu', use natural Karachi/Lahore conversational style (e.g., use 'masla', 'hal', 'dhamaal' instead of formal translated words).
6. FORMAT: Strictly follow the requested format (Headings/Bullets/Paragraphs).

Output ONLY the content. No "Here is your content" filler.`;

const geminiError = (err) => {
  const msg = err.message || '';
  console.error(`[Gemini Error] ${msg.slice(0, 200)}`);

  if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
    const e = new Error('Invalid Gemini API key. Please check your GEMINI_API_KEY secret.');
    e.statusCode = 503;
    throw e;
  }
  if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota') || msg.includes('429')) {
    const e = new Error('Gemini free tier quota reached. Please wait a minute and try again.');
    e.statusCode = 429;
    throw e;
  }
  if (msg.includes('overloaded') || msg.includes('503')) {
    const e = new Error('Gemini is temporarily overloaded. Please try again shortly.');
    e.statusCode = 503;
    throw e;
  }
  const e = new Error(msg || 'AI generation failed. Please try again.');
  e.statusCode = 500;
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
