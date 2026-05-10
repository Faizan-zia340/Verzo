import getClient, { MODEL, API_VERSION } from '../config/gemini.js';
import { buildSEOPrompt, buildTunePrompt } from './prompts.js';

const REQUEST_OPTIONS = { apiVersion: API_VERSION };

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

export const generateText = async (prompt) => {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: MODEL }, REQUEST_OPTIONS);
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    geminiError(err);
  }
};

export const generateSEO = async (content) => {
  try {
    const genAI = getClient();
    const model = genAI.getGenerativeModel({ model: MODEL }, REQUEST_OPTIONS);
    const result = await model.generateContent(buildSEOPrompt(content));
    const raw = result.response.text().trim().replace(/```json|```/g, '').trim();
    return JSON.parse(raw);
  } catch {
    return { title: '', description: '', keywords: [] };
  }
};

export const tuneText = async (text, action) => {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: MODEL }, REQUEST_OPTIONS);
  try {
    const result = await model.generateContent(buildTunePrompt(text, action));
    return result.response.text();
  } catch (err) {
    geminiError(err);
  }
};

export { geminiError };
