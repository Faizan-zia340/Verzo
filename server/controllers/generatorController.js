import openai from '../config/openai.js';
import { generateRAGContent } from '../utils/openai.js';
import { buildPrompt, buildSEOPrompt, buildTunePrompt } from '../utils/prompts.js';
import Content from '../models/Content.js';
import Credit from '../models/Credit.js';
import User from '../models/User.js';
import Context from '../models/Context.js';
import { io } from '../server.js';

const checkApiKey = () => {
  if (!process.env.OPENAI_API_KEY) {
    const err = new Error('OpenAI API key is not configured.');
    err.statusCode = 503;
    throw err;
  }
};

const openAIErrorMessage = (err) => {
  const status = err.response?.status;
  const detail = err.response?.data?.error?.message || '';

  console.error(`[OpenAI Error] status=${status} detail="${detail}"`);

  if (status === 401) return 'Invalid OpenAI API key. Please contact the administrator.';
  if (status === 429) {
    // Distinguish quota exhausted (daily/billing) from per-minute rate limit
    if (detail.toLowerCase().includes('quota') || detail.toLowerCase().includes('billing') || detail.toLowerCase().includes('insufficient')) {
      return 'OpenAI quota exhausted. The API billing limit has been reached — please add credits at platform.openai.com/account/billing.';
    }
    return 'OpenAI rate limit reached. Please wait 30–60 seconds and try again.';
  }
  if (status === 402) return 'OpenAI account billing issue. Please add credits at platform.openai.com/account/billing.';
  if (status === 503 || status === 500) return 'OpenAI service is temporarily unavailable. Try again shortly.';
  return err.message || 'AI generation failed. Please try again.';
};

// ── Streaming generation via SSE ─────────────────────────────────
export const streamGenerate = async (req, res, next) => {
  try {
    checkApiKey();
    const { type, prompt, tone, length, language = 'english' } = req.body;
    const userId = req.user._id;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const sendEvent = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    const fullPrompt = buildPrompt({ type, prompt, tone, length, language });

    let streamResponse;
    try {
      streamResponse = await openai.createChatCompletion(
        {
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: fullPrompt }],
          max_tokens: 900,
          temperature: 0.7,
          stream: true,
        },
        { responseType: 'stream' }
      );
    } catch (err) {
      // For streaming requests, err.response.data is itself a stream — read it for the real message
      const status = err.response?.status;
      let detail = '';
      try {
        if (err.response?.data && typeof err.response.data.read === 'function') {
          const chunks = [];
          for await (const chunk of err.response.data) chunks.push(chunk);
          const raw = Buffer.concat(chunks).toString();
          detail = JSON.parse(raw)?.error?.message || '';
        } else {
          detail = err.response?.data?.error?.message || '';
        }
      } catch {}
      console.error(`[OpenAI Stream Error] status=${status} detail="${detail}"`);
      let msg = 'AI generation failed. Please try again.';
      if (status === 401) msg = 'Invalid OpenAI API key. Please contact the administrator.';
      else if (status === 429) {
        const d = detail.toLowerCase();
        msg = (d.includes('quota') || d.includes('billing') || d.includes('insufficient'))
          ? 'OpenAI quota exhausted. Please add billing credits at platform.openai.com/account/billing.'
          : 'OpenAI rate limit reached. Please wait 30–60 seconds and try again.';
      } else if (status === 402) msg = 'OpenAI billing issue. Please add credits at platform.openai.com/account/billing.';
      sendEvent({ error: msg });
      res.end();
      return;
    }

    let fullOutput = '';

    streamResponse.data.on('data', (chunk) => {
      const lines = chunk.toString().split('\n').filter((l) => l.trim() !== '');
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') continue;
        try {
          const parsed = JSON.parse(raw);
          const token = parsed.choices?.[0]?.delta?.content || '';
          if (token) {
            fullOutput += token;
            sendEvent({ token });
          }
        } catch {}
      }
    });

    streamResponse.data.on('end', async () => {
      if (!fullOutput) {
        sendEvent({ error: 'No content was generated. Please try again.' });
        res.end();
        return;
      }

      try {
        // Generate SEO data (separate non-streaming call)
        let seoData = { title: '', description: '', keywords: [] };
        try {
          const seoResponse = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: buildSEOPrompt(fullOutput) }],
            max_tokens: 300,
            temperature: 0.3,
          });
          const raw = seoResponse.data.choices[0].message.content.trim();
          seoData = JSON.parse(raw.replace(/```json|```/g, '').trim());
        } catch {}

        const [content] = await Promise.all([
          Content.create({ user: userId, type, prompt, output: fullOutput, creditsUsed: 1, language, seoData }),
          User.findByIdAndUpdate(userId, { $inc: { credits: -1 } }),
          Credit.create({ user: userId, amount: -1, type: 'usage', description: `Generated ${type} content` }),
        ]);

        io.to(userId.toString()).emit('generation:done', { content });
        sendEvent({ done: true, seoData, contentId: content._id });
        res.end();
      } catch (err) {
        sendEvent({ error: 'Failed to save content. Please try again.' });
        res.end();
      }
    });

    streamResponse.data.on('error', (err) => {
      sendEvent({ error: openAIErrorMessage(err) });
      res.end();
    });
  } catch (err) {
    if (!res.headersSent) return next(err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
};

// ── Non-streaming generate (fallback) ───────────────────────────
export const generate = async (req, res, next) => {
  try {
    checkApiKey();
    const { type, prompt, tone, length, language = 'english' } = req.body;
    const userId = req.user._id;

    io.to(userId.toString()).emit('generation:start');

    const fullPrompt = buildPrompt({ type, prompt, tone, length, language });
    let response;
    try {
      response = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: fullPrompt }],
        max_tokens: 900,
        temperature: 0.7,
      });
    } catch (err) {
      const e = new Error(openAIErrorMessage(err));
      e.statusCode = err.response?.status || 500;
      throw e;
    }

    const output = response.data.choices[0].message.content.trim();

    let seoData = { title: '', description: '', keywords: [] };
    try {
      const seoResponse = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: buildSEOPrompt(output) }],
        max_tokens: 300,
        temperature: 0.3,
      });
      seoData = JSON.parse(seoResponse.data.choices[0].message.content.trim().replace(/```json|```/g, '').trim());
    } catch {}

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
    checkApiKey();
    const { text, action } = req.body;
    if (!text || !action) return res.status(400).json({ message: 'text and action are required' });
    const validActions = ['shorten', 'engaging', 'professional'];
    if (!validActions.includes(action)) return res.status(400).json({ message: 'Invalid action. Use: shorten, engaging, or professional' });

    let result;
    try {
      result = await generateRAGContent(buildTunePrompt(text, action));
    } catch (err) {
      const e = new Error(openAIErrorMessage(err));
      e.statusCode = err.response?.status || 500;
      throw e;
    }

    res.json({ output: result });
  } catch (err) {
    next(err);
  }
};

// ── RAG-augmented generation ─────────────────────────────────────
export const generateAIContent = async (req, res, next) => {
  try {
    checkApiKey();
    const { userPrompt, topicKeywords = [] } = req.body;
    if (!userPrompt) return res.status(400).json({ message: 'userPrompt is required' });

    const foundContext = topicKeywords.length
      ? await Context.findOne({ keywords: { $in: topicKeywords } })
      : null;

    const finalPrompt = foundContext
      ? `Context Information:\n${foundContext.information}\n\nStrict Instructions: Use the above Context Information to answer accurately. Do not fabricate facts.\n\nUser Prompt: ${userPrompt}`
      : userPrompt;

    let result;
    try {
      result = await generateRAGContent(finalPrompt);
    } catch (err) {
      const e = new Error(openAIErrorMessage(err));
      e.statusCode = err.response?.status || 500;
      throw e;
    }

    res.json({ response: result, contextUsed: !!foundContext, contextTitle: foundContext?.title || null });
  } catch (err) {
    next(err);
  }
};
