import getClient from '../config/gemini.js';
import { buildSEOPrompt, buildTunePrompt } from './prompts.js';

const geminiError = (err) => {
  const msg = err.message || '';
  const status = err.status || err.httpStatusCode || 500;
  console.error(`[Gemini Error] status=${status} msg="${msg}"`);

  if (status === 400 || msg.includes('API_KEY_INVALID') || msg.includes('API key')) {
    const e = new Error('Invalid Gemini API key. Please check your GEMINI_API_KEY secret.');
    e.statusCode = 503;
    throw e;
  }
  if (status === 429 || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
    const e = new Error('Gemini quota reached. Free tier limit hit — wait a minute and try again.');
    e.statusCode = 429;
    throw e;
  }
  if (status === 503 || msg.includes('overloaded')) {
    const e = new Error('Gemini is temporarily overloaded. Please try again shortly.');
    e.statusCode = 503;
    throw e;
  }
  const e = new Error(msg || 'AI generation failed. Please try again.');
  e.statusCode = status;
  throw e;
};

export const generateText = async (prompt) => {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(buildSEOPrompt(content));
    const raw = result.response.text().trim().replace(/```json|```/g, '').trim();
    return JSON.parse(raw);
  } catch {
    return { title: '', description: '', keywords: [] };
  }
};

export const tuneText = async (text, action) => {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  try {
    const result = await model.generateContent(buildTunePrompt(text, action));
    return result.response.text();
  } catch (err) {
    geminiError(err);
  }
};

export { geminiError };
