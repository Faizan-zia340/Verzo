import { generateText, generateSEO, tuneText, getModel, withSystem } from '../utils/gemini.js';
import { buildPrompt } from '../utils/prompts.js';
import { fetchImages } from '../utils/unsplash.js';
import { fetchAndAnalyzeImages, embedImagesInContent } from '../utils/imageService.js';
import Content from '../models/Content.js';
import Credit from '../models/Credit.js';
import User from '../models/User.js';
import Context from '../models/Context.js';
import { findRelevantContexts } from '../utils/embeddings.js';
import { io } from '../server.js';
import logger from '../utils/logger.js';
import asyncHandler from '../utils/asyncHandler.js';

const checkKey = () => {
  if (!process.env.GEMINI_API_KEY) {
    const err = new Error('GEMINI_API_KEY is not configured on the server.');
    err.statusCode = 503;
    throw err;
  }
};

/**
 * Splits Gemini output into clean blog content + structured Reality Check data.
 * Returns { cleanContent, realityCheck } where realityCheck may be null.
 */
const parseRealityCheck = (rawOutput) => {
  // Separator is a line of dashes followed by **REALITY CHECK**
  const sepMatch = rawOutput.match(/\n*-{3,}\s*\n\*\*REALITY CHECK\*\*/);
  if (!sepMatch) return { cleanContent: rawOutput.trim(), realityCheck: null };

  const cleanContent = rawOutput.slice(0, sepMatch.index).trim();
  const rcSection = rawOutput.slice(sepMatch.index);

  // Parse table rows: | Pillar name | Score | Verdict |
  const pillars = [];
  const rowReg = /\|\s*([^|\-][^|]*?)\s*\|\s*(\d+(?:\.\d+)?)\s*\|\s*([^|]+?)\s*\|/g;
  let m;
  while ((m = rowReg.exec(rcSection)) !== null) {
    const name = m[1].trim();
    if (!name || name === 'Pillar' || name === 'Score /10' || name === 'Verdict') continue;
    pillars.push({ name, score: parseFloat(m[2]), verdict: m[3].trim() });
  }

  // Parse overall rating
  const ratingMatch = rcSection.match(/Estimated Global AI Rating[^0-9]*([\d.]+)\s*\/\s*10/);
  const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;

  return {
    cleanContent,
    realityCheck: pillars.length ? { pillars, rating } : null,
  };
};

const generateContentData = async ({ type, prompt, language = 'english_us', format = 'paragraphs' }) => {
  checkKey();

  const rawOutput = await generateText(buildPrompt({ type, prompt, language, format }));
  const { cleanContent, realityCheck } = parseRealityCheck(rawOutput);
  const seoData = await generateSEO(cleanContent);
  const keywords = seoData?.imageKeywords || seoData?.keywords || [];

  let images = [];
  let finalOutput = cleanContent;

  if (type === 'blog' && process.env.UNSPLASH_ACCESS_KEY) {
    images = await fetchAndAnalyzeImages(keywords);
    if (images.length) finalOutput = await embedImagesInContent(cleanContent, images);
  } else {
    images = await fetchImages(keywords);
  }

  return {
    data: {
      type,
      prompt,
      output: finalOutput,
      creditsUsed: 1,
      language,
      format,
      seoData,
      images,
      updatedAt: new Date(),
    },
    realityCheck,
  };
};

// ── Streaming generation via SSE ─────────────────────────────────
export const streamGenerate = asyncHandler(async (req, res) => {
  try {
    checkKey();
    const { type, prompt, tone, length, language = 'english_us', format = 'paragraphs' } = req.body;
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
      const model = getModel();
      const streamResult = await model.generateContentStream(withSystem(fullPrompt));

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
      logger.error({ msg: msg.slice(0, 200) }, 'Gemini stream error');
      sendEvent({ error: userMsg });
      res.end();
      return;
    }

    if (!fullOutput) {
      sendEvent({ error: 'No content was generated. Please try again.' });
      res.end();
      return;
    }

    // Split clean content from Reality Check section
    const { cleanContent, realityCheck } = parseRealityCheck(fullOutput);

    // Post-generation: SEO + images + save
    try {
      const seoData = await generateSEO(cleanContent);
      const keywords = seoData?.imageKeywords || seoData?.keywords || [];

      let images = [];
      let finalOutput = cleanContent;

      if (type === 'blog' && process.env.UNSPLASH_ACCESS_KEY) {
        sendEvent({ status: 'Fetching and analyzing images...' });
        images = await fetchAndAnalyzeImages(keywords);
        if (images.length) {
          finalOutput = await embedImagesInContent(cleanContent, images);
        }
      } else {
        images = await fetchImages(keywords);
      }

      const [content] = await Promise.all([
        Content.create({
          user: userId,
          type,
          prompt,
          output: finalOutput,
          creditsUsed: 1,
          language,
          format,
          seoData,
          images,
        }),
        User.findByIdAndUpdate(userId, { $inc: { credits: -1 } }),
        Credit.create({ user: userId, amount: -1, type: 'usage', description: `Generated ${type} content` }),
      ]);

      io.to(userId.toString()).emit('generation:done', { content });
      sendEvent({ done: true, seoData, images, contentWithImages: finalOutput, realityCheck, contentId: content._id });
    } catch (err) {
      logger.error({ err: err.message }, 'Content save error');
      sendEvent({ error: 'Content generated but failed to save. Please try again.' });
    }

    res.end();
  } catch (err) {
    if (!res.headersSent) throw err;
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// ── Non-streaming generate (fallback) ───────────────────────────
export const generate = asyncHandler(async (req, res) => {
  checkKey();
  const { type, prompt, tone, length, language = 'english_us', format = 'paragraphs' } = req.body;
  const userId = req.user._id;

  io.to(userId.toString()).emit('generation:start');

  const fullPrompt = buildPrompt({ type, prompt, tone, length, language, format });
  const rawOutput = await generateText(fullPrompt);
  const { cleanContent, realityCheck } = parseRealityCheck(rawOutput);

  const seoData = await generateSEO(cleanContent);
  const keywords = seoData?.imageKeywords || seoData?.keywords || [];

  let images = [];
  let finalOutput = cleanContent;

  if (type === 'blog' && process.env.UNSPLASH_ACCESS_KEY) {
    images = await fetchAndAnalyzeImages(keywords);
    if (images.length) finalOutput = await embedImagesInContent(cleanContent, images);
  } else {
    images = await fetchImages(keywords);
  }

  const [content] = await Promise.all([
    Content.create({ user: userId, type, prompt, output: finalOutput, creditsUsed: 1, language, format, seoData, images }),
    User.findByIdAndUpdate(userId, { $inc: { credits: -1 } }),
    Credit.create({ user: userId, amount: -1, type: 'usage', description: `Generated ${type} content` }),
  ]);

  io.to(userId.toString()).emit('generation:done', { content });
  res.status(200).json({ content, realityCheck });
});

// ── Tune existing content (no credit deduction) ──────────────────
export const tuneContent = asyncHandler(async (req, res) => {
  checkKey();
  const { text, action } = req.body;
  if (!text || !action) return res.status(400).json({ message: 'text and action are required' });
  const validActions = ['shorten', 'engaging', 'professional', 'reduce_hype'];
  if (!validActions.includes(action)) return res.status(400).json({ message: 'Invalid action' });

  const raw = await tuneText(text, action);
  const { cleanContent, realityCheck } = parseRealityCheck(raw);
  res.status(200).json({ output: cleanContent, realityCheck });
});

// ── RAG-augmented generation ─────────────────────────────────────
export const generateAIContent = asyncHandler(async (req, res) => {
  checkKey();
  const { userPrompt, topicKeywords = [] } = req.body;
  if (!userPrompt) return res.status(400).json({ message: 'userPrompt is required' });

  let matchedContexts = [];
  let retrievalMethod = 'none';

  const allContexts = await Context.find().select('+embedding');
  if (allContexts.length) {
    const { matches, usedEmbeddings } = await findRelevantContexts(userPrompt, allContexts, 3);
    if (usedEmbeddings && matches.length) {
      matchedContexts = matches;
      retrievalMethod = 'embedding';
    } else if (topicKeywords.length) {
      const keywordMatch = await Context.findOne({ keywords: { $in: topicKeywords } });
      if (keywordMatch) {
        matchedContexts = [keywordMatch];
        retrievalMethod = 'keyword';
      }
    }
  }

  const contextBlock = matchedContexts.length
    ? matchedContexts.map((c) => `[${c.title}]\n${c.information}`).join('\n\n')
    : null;

  const finalPrompt = contextBlock
    ? `Context Information:\n${contextBlock}\n\nStrict Instructions: Use the above Context Information to answer accurately. Do not fabricate facts.\n\nUser Prompt: ${userPrompt}`
    : userPrompt;

  const raw = await generateText(finalPrompt);
  const { cleanContent, realityCheck } = parseRealityCheck(raw);
  res.status(200).json({
    response: cleanContent,
    realityCheck,
    contextUsed: matchedContexts.length > 0,
    contextTitles: matchedContexts.map((c) => c.title),
    retrievalMethod,
  });
});

export const regenerateContent = asyncHandler(async (req, res) => {
  const existing = await Content.findOne({ _id: req.params.id, user: req.user._id });
  if (!existing) return res.status(404).json({ message: 'Content not found' });

  const { data, realityCheck } = await generateContentData({
    type: existing.type,
    prompt: existing.prompt,
    language: existing.language,
    format: existing.format,
  });

  const content = await Content.findOneAndUpdate(
    { _id: existing._id, user: req.user._id },
    { $set: data },
    { new: true, runValidators: true }
  );

  await Promise.all([
    User.findByIdAndUpdate(req.user._id, { $inc: { credits: -1 } }),
    Credit.create({
      user: req.user._id,
      amount: -1,
      type: 'usage',
      description: `Regenerated ${existing.type} content`,
    }),
  ]);

  io.to(req.user._id.toString()).emit('generation:done', { content });
  res.status(200).json({ content, realityCheck });
});
