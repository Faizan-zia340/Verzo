import { generateText, generateSEO, tuneText, geminiError } from '../utils/gemini.js';
import { buildPrompt } from '../utils/prompts.js';
import Content from '../models/Content.js';
import Credit from '../models/Credit.js';
import User from '../models/User.js';
import Context from '../models/Context.js';
import { io } from '../server.js';
import getClient, { MODEL, API_VERSION } from '../config/gemini.js';

const checkKey = () => {
  if (!process.env.GEMINI_API_KEY) {
    const err = new Error('GEMINI_API_KEY is not configured on the server.');
    err.statusCode = 503;
    throw err;
  }
};

// ── Streaming generation via SSE ─────────────────────────────────
export const streamGenerate = async (req, res, next) => {
  try {
    checkKey();
    const { type, prompt, tone, length, language = 'english', format = 'paragraphs' } = req.body;
    const userId = req.user._id;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const sendEvent = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    const fullPrompt = buildPrompt({ type, prompt, tone, length, language, format });

    let fullOutput = '';
    try {
      const genAI = getClient();
      const model = genAI.getGenerativeModel({ model: MODEL }, { apiVersion: API_VERSION });
      const streamResult = await model.generateContentStream(fullPrompt);

      for await (const chunk of streamResult.stream) {
        const token = chunk.text();
        if (token) {
          fullOutput += token;
          sendEvent({ token });
        }
      }
    } catch (err) {
      const msg = err.message || '';
      let userMsg = 'AI generation failed. Please try again.';
      if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) userMsg = 'Invalid Gemini API key. Please check your GEMINI_API_KEY secret.';
      else if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota') || msg.includes('429')) userMsg = 'Gemini free tier quota reached. Please wait a minute and try again.';
      else if (msg.includes('overloaded') || msg.includes('503')) userMsg = 'Gemini is temporarily overloaded. Please try again shortly.';
      console.error('[Gemini Stream Error]', msg.slice(0, 200));
      sendEvent({ error: userMsg });
      res.end();
      return;
    }

    if (!fullOutput) {
      sendEvent({ error: 'No content was generated. Please try again.' });
      res.end();
      return;
    }

    // Generate SEO + save to DB
    try {
      const seoData = await generateSEO(fullOutput);

      const [content] = await Promise.all([
        Content.create({ user: userId, type, prompt, output: fullOutput, creditsUsed: 1, language, seoData }),
        User.findByIdAndUpdate(userId, { $inc: { credits: -1 } }),
        Credit.create({ user: userId, amount: -1, type: 'usage', description: `Generated ${type} content` }),
      ]);

      io.to(userId.toString()).emit('generation:done', { content });
      sendEvent({ done: true, seoData, contentId: content._id });
    } catch (err) {
      console.error('[Save Error]', err.message);
      sendEvent({ error: 'Content generated but failed to save. Please try again.' });
    }

    res.end();
  } catch (err) {
    if (!res.headersSent) return next(err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
};

// ── Non-streaming generate (fallback) ───────────────────────────
export const generate = async (req, res, next) => {
  try {
    checkKey();
    const { type, prompt, tone, length, language = 'english', format = 'paragraphs' } = req.body;
    const userId = req.user._id;

    io.to(userId.toString()).emit('generation:start');

    const fullPrompt = buildPrompt({ type, prompt, tone, length, language, format });
    const output = await generateText(fullPrompt);
    const seoData = await generateSEO(output);

    const [content] = await Promise.all([
      Content.create({ user: userId, type, prompt, output, creditsUsed: 1, language, seoData }),
      User.findByIdAndUpdate(userId, { $inc: { credits: -1 } }),
      Credit.create({ user: userId, amount: -1, type: 'usage', description: `Generated ${type} content` }),
    ]);

    io.to(userId.toString()).emit('generation:done', { content });
    res.json({ content });
  } catch (err) {
    next(err);
  }
};

// ── Tune existing content (no credit deduction) ──────────────────
export const tuneContent = async (req, res, next) => {
  try {
    checkKey();
    const { text, action } = req.body;
    if (!text || !action) return res.status(400).json({ message: 'text and action are required' });
    const validActions = ['shorten', 'engaging', 'professional', 'reduce_hype'];
    if (!validActions.includes(action)) return res.status(400).json({ message: 'Invalid action' });

    const output = await tuneText(text, action);
    res.json({ output });
  } catch (err) {
    next(err);
  }
};

// ── RAG-augmented generation ─────────────────────────────────────
export const generateAIContent = async (req, res, next) => {
  try {
    checkKey();
    const { userPrompt, topicKeywords = [] } = req.body;
    if (!userPrompt) return res.status(400).json({ message: 'userPrompt is required' });

    const foundContext = topicKeywords.length
      ? await Context.findOne({ keywords: { $in: topicKeywords } })
      : null;

    const finalPrompt = foundContext
      ? `Context Information:\n${foundContext.information}\n\nStrict Instructions: Use the above Context Information to answer accurately. Do not fabricate facts.\n\nUser Prompt: ${userPrompt}`
      : userPrompt;

    const result = await generateText(finalPrompt);
    res.json({ response: result, contextUsed: !!foundContext, contextTitle: foundContext?.title || null });
  } catch (err) {
    next(err);
  }
};
