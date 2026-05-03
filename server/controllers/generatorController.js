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

// Streaming generation with SSE
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
      const status = err.response?.status;
      let message = 'OpenAI request failed';
      if (status === 401) message = 'Invalid OpenAI API key.';
      else if (status === 429) message = 'OpenAI rate limit reached. Please wait and try again.';
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
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
            res.write(`data: ${JSON.stringify({ token })}\n\n`);
          }
        } catch {}
      }
    });

    streamResponse.data.on('end', async () => {
      try {
        // Generate SEO data
        let seoData = { title: '', description: '', keywords: [] };
        try {
          const seoResponse = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: buildSEOPrompt(fullOutput) }],
            max_tokens: 250,
            temperature: 0.3,
          });
          const raw = seoResponse.data.choices[0].message.content.trim();
          const jsonStr = raw.replace(/```json|```/g, '').trim();
          seoData = JSON.parse(jsonStr);
        } catch {}

        const [content] = await Promise.all([
          Content.create({ user: userId, type, prompt, output: fullOutput, creditsUsed: 1, language, seoData }),
          User.findByIdAndUpdate(userId, { $inc: { credits: -1 } }),
          Credit.create({ user: userId, amount: -1, type: 'usage', description: `Generated ${type} content` }),
        ]);

        io.to(userId.toString()).emit('generation:done', { content });
        res.write(`data: ${JSON.stringify({ done: true, seoData, contentId: content._id })}\n\n`);
        res.end();
      } catch (err) {
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
      }
    });

    streamResponse.data.on('error', (err) => {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    });
  } catch (err) {
    next(err);
  }
};

// Non-streaming fallback generate
export const generate = async (req, res, next) => {
  try {
    checkApiKey();
    const { type, prompt, tone, length, language = 'english' } = req.body;
    const userId = req.user._id;

    io.to(userId.toString()).emit('generation:start');

    const fullPrompt = buildPrompt({ type, prompt, tone, length, language });
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: fullPrompt }],
      max_tokens: 900,
      temperature: 0.7,
    });
    const output = response.data.choices[0].message.content.trim();

    let seoData = { title: '', description: '', keywords: [] };
    try {
      const seoResponse = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: buildSEOPrompt(output) }],
        max_tokens: 250,
        temperature: 0.3,
      });
      const raw = seoResponse.data.choices[0].message.content.trim();
      seoData = JSON.parse(raw.replace(/```json|```/g, '').trim());
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

// Tune existing content — no credit deduction
export const tuneContent = async (req, res, next) => {
  try {
    checkApiKey();
    const { text, action } = req.body;
    if (!text || !action) return res.status(400).json({ message: 'text and action are required' });
    const validActions = ['shorten', 'engaging', 'professional'];
    if (!validActions.includes(action)) return res.status(400).json({ message: 'Invalid action' });

    const tunePrompt = buildTunePrompt(text, action);
    const result = await generateRAGContent(tunePrompt);
    res.json({ output: result });
  } catch (err) {
    next(err);
  }
};

// RAG-augmented generation
export const generateAIContent = async (req, res, next) => {
  try {
    checkApiKey();
    const { userPrompt, topicKeywords = [] } = req.body;
    if (!userPrompt) return res.status(400).json({ message: 'userPrompt is required' });

    const foundContext = topicKeywords.length
      ? await Context.findOne({ keywords: { $in: topicKeywords } })
      : null;

    const finalPrompt = foundContext
      ? `Context Information: ${foundContext.information}\n\nStrict Instructions: Use the above Context Information to answer. Do not fabricate facts.\n\nUser Prompt: ${userPrompt}`
      : userPrompt;

    const result = await generateRAGContent(finalPrompt);
    res.json({ response: result, contextUsed: !!foundContext, contextTitle: foundContext?.title || null });
  } catch (err) {
    next(err);
  }
};
