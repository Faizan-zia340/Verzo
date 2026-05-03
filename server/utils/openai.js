import openai from '../config/openai.js';
import { buildPrompt } from './prompts.js';

const checkApiKey = () => {
  if (!process.env.OPENAI_API_KEY) {
    const err = new Error('OpenAI API key is not configured. Add OPENAI_API_KEY to server/.env and restart the server.');
    err.statusCode = 503;
    throw err;
  }
};

const handleOpenAIError = (err) => {
  const status = err.response?.status;
  if (status === 401) {
    const e = new Error('Invalid OpenAI API key. Check your OPENAI_API_KEY in server/.env.');
    e.statusCode = 503;
    throw e;
  }
  if (status === 429) {
    const e = new Error('OpenAI rate limit reached. Please wait a moment and try again.');
    e.statusCode = 429;
    throw e;
  }
  if (status === 402) {
    const e = new Error('OpenAI account has no credits. Please check your OpenAI billing.');
    e.statusCode = 402;
    throw e;
  }
  throw err;
};

export const generateContent = async ({ type, prompt, tone, length }) => {
  checkApiKey();
  const fullPrompt = buildPrompt({ type, prompt, tone, length });
  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: fullPrompt }],
      max_tokens: 800,
      temperature: 0.7,
    });
    return response.data.choices[0].message.content.trim();
  } catch (err) {
    handleOpenAIError(err);
  }
};

export const generateRAGContent = async (finalPrompt) => {
  checkApiKey();
  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: finalPrompt }],
      max_tokens: 1000,
      temperature: 0.7,
    });
    return response.data.choices[0].message.content.trim();
  } catch (err) {
    handleOpenAIError(err);
  }
};
