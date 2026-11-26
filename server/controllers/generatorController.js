import { generateText, generateSEO, tuneText, getModel, withSystem } from '../utils/gemini.js';
import { buildPrompt } from '../utils/prompts.js';
import { checkQuality, generateWithQualityCheck, retryGeneration } from '../utils/qualityCheck.js';
import { fetchImages } from '../utils/unsplash.js';
import { fetchAndAnalyzeImages, embedImagesInContent } from '../utils/imageService.js';
import Content from '../models/Content.js';
import Credit from '../models/Credit.js';
import Context from '../models/Context.js';
import { findRelevantContexts } from '../utils/embeddings.js';
import { io } from '../server.js';
import logger from '../utils/logger.js';
import asyncHandler from '../utils/asyncHandler.js';
import { refundCredit } from '../utils/credits.js';

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

const generateContentData = async ({ type, prompt, tone = 'professional', length = 'medium', language = 'english_us', format = 'paragraphs', details = {} }) => {
  checkKey();

  // Quality-checked generation: retries once if the first draft has
  // placeholders, banned phrases or other issues. Only the final text is used.
  const { text: rawOutput, qualityReport } = await generateWithQualityCheck(generateText, {
    prompt: buildPrompt({ type, prompt, tone, length, language, format, details }),
    type,
    input: details,
    length,
  });
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
    qualityReport,
  };
};

// ── Streaming generation via SSE ─────────────────────────────────
export const streamGenerate = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // The credit was reserved by the middleware before this handler ran.
  // Any failure exit below must give it back (refundOnce guards double
  // refunds). Defined outside the try so the outer catch can refund too
  // (e.g. a missing API key fails before any headers are sent).
  let refunded = false;
  const refundOnce = async () => {
    if (req.creditReserved && !refunded) {
      refunded = true;
      await refundCredit(userId, req.creditReserved);
    }
  };

  try {
    checkKey();
    const { type, prompt, tone, length, language = 'english_us', format = 'paragraphs', ...details } = req.body;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const sendEvent = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    const fullPrompt = buildPrompt({ type, prompt, tone, length, language, format, details });

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
      await refundOnce();
      sendEvent({ error: userMsg });
      res.end();
      return;
    }

    if (!fullOutput) {
      await refundOnce();
      sendEvent({ error: 'No content was generated. Please try again.' });
      res.end();
      return;
    }

    // Split clean content from Reality Check section
    let { cleanContent, realityCheck } = parseRealityCheck(fullOutput);

    // Quality check the streamed draft. If it fails (placeholders, banned
    // phrases, ...), regenerate ONCE with the issues as feedback and keep
    // the best attempt. Only the final text is saved — and only 1 credit
    // is deducted for the whole request, retries included.
    let qualityReport = checkQuality(cleanContent, { type, input: req.body, length });
    if (!qualityReport.passed) {
      sendEvent({ status: 'Quality check flagged issues — regenerating once...' });
      try {
        const retry = await retryGeneration(generateText, {
          prompt: fullPrompt,
          firstText: fullOutput,
          firstReport: qualityReport,
          type,
          input: req.body,
          length,
        });
        const parsed = parseRealityCheck(retry.text);
        cleanContent = parsed.cleanContent;
        realityCheck = parsed.realityCheck;
        qualityReport = retry.qualityReport;
      } catch (err) {
        // Keep the streamed first attempt if the retry itself fails.
        logger.error({ err: err.message }, 'Quality retry failed; keeping first attempt');
        qualityReport = { passed: false, issues: qualityReport.issues, retried: true };
      }
    } else {
      qualityReport = { passed: true, issues: [], retried: false };
    }

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
        // NOTE: no $inc here anymore — the credit was reserved by the middleware.
        Credit.create({ user: userId, amount: -1, type: 'usage', description: `Generated ${type} content` }),
      ]);

      io.to(userId.toString()).emit('generation:done', { content });
      sendEvent({ done: true, seoData, images, contentWithImages: finalOutput, realityCheck, contentId: content._id, qualityReport });
    } catch (err) {
      logger.error({ err: err.message }, 'Content save error');
      await refundOnce();
      sendEvent({ error: 'Content generated but failed to save. Please try again.' });
    }

    res.end();
  } catch (err) {
    await refundOnce();
    if (!res.headersSent) throw err;
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// ── Non-streaming generate (fallback) ───────────────────────────
export const generate = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    checkKey();
    const { type, prompt, tone, length, language = 'english_us', format = 'paragraphs', ...details } = req.body;

    io.to(userId.toString()).emit('generation:start');

    // Quality-checked generation: retries once if the first draft fails the
    // check. Only the final text is saved and only 1 credit is deducted.
    const { text: rawOutput, qualityReport } = await generateWithQualityCheck(generateText, {
      prompt: buildPrompt({ type, prompt, tone, length, language, format, details }),
      type,
      input: req.body,
      length,
    });
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
      // NOTE: no $inc here anymore — the credit was reserved by the middleware.
      Credit.create({ user: userId, amount: -1, type: 'usage', description: `Generated ${type} content` }),
    ]);

    io.to(userId.toString()).emit('generation:done', { content });
    res.status(200).json({ content, realityCheck, qualityReport });
  } catch (err) {
    // Generation or save failed: give the reserved credit back.
    // checkKey is inside the try too — a missing API key must not cost a credit.
    if (req.creditReserved) await refundCredit(userId, req.creditReserved);
    throw err;
  }
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

  // Quality-checked generation: retries once if the first draft fails the
  // check. The RAG route saves nothing, so the retry only costs one extra
  // AI call.
  const { text: raw, qualityReport } = await generateWithQualityCheck(generateText, {
    prompt: finalPrompt,
    type: 'general',
    input: {},
    length: 'medium',
  });
  const { cleanContent, realityCheck } = parseRealityCheck(raw);

  // SECURITY (H1): the RAG route now charges 1 credit like the other
  // generate endpoints (it was previously free and unauthenticated).
  await Promise.all([
    User.findByIdAndUpdate(req.user._id, { $inc: { credits: -1 } }),
    Credit.create({ user: req.user._id, amount: -1, type: 'usage', description: 'Generated RAG content' }),
  ]);

  res.status(200).json({
    response: cleanContent,
    realityCheck,
    contextUsed: matchedContexts.length > 0,
    contextTitles: matchedContexts.map((c) => c.title),
    retrievalMethod,
    qualityReport,
  });
});

export const regenerateContent = asyncHandler(async (req, res) => {
  const existing = await Content.findOne({ _id: req.params.id, user: req.user._id });
  if (!existing) {
    // Nothing was generated, but the middleware already reserved a credit.
    if (req.creditReserved) await refundCredit(req.user._id, req.creditReserved);
    return res.status(404).json({ message: 'Content not found' });
  }

  try {
    const { data, realityCheck, qualityReport } = await generateContentData({
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

    // NOTE: no $inc here anymore — the credit was reserved by the middleware.
    await Credit.create({
      user: req.user._id,
      amount: -1,
      type: 'usage',
      description: `Regenerated ${existing.type} content`,
    });

    io.to(req.user._id.toString()).emit('generation:done', { content });
    res.status(200).json({ content, realityCheck, qualityReport });
  } catch (err) {
    // Regeneration failed: give the reserved credit back.
    if (req.creditReserved) await refundCredit(req.user._id, req.creditReserved);
    throw err;
  }
});

