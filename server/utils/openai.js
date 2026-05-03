import openai from '../config/openai.js';
import { buildPrompt } from './prompts.js';

export const generateContent = async ({ type, prompt, tone, length }) => {
  const fullPrompt = buildPrompt({ type, prompt, tone, length });

  const response = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: fullPrompt }],
    max_tokens: 800,
    temperature: 0.7,
  });

  return response.data.choices[0].message.content.trim();
};
