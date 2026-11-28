import { generateText, generateSEO, tuneText, getModel, withSystem, generateWithImage } from '../utils/gemini.js';
import { buildPrompt } from '../utils/prompts.js';
import { checkQuality, generateWithQualityCheck, retryGeneration, sanitizePlaceholders, stripAgentLabels } from '../utils/qualityCheck.js';
import { runEditorPass, runTwoPassDraft } from '../utils/twoPass.js';
import { validateImageFile, applyImageDefaults } from '../utils/imageInput.js';
import { ALLOWED_SUBTYPES, generateSchema } from '../utils/validators.js';
import { fetchImages } from '../utils/unsplash.js';
import { fetchAndAnalyzeImages, embedImagesInContent } from '../utils/imageService.js';
import Content from '../models/Content.js';
import Credit from '../models/Credit.js';
import Context from '../models/Context.js';
import { findRelevantContexts } from '../utils/embeddings.js';
import logger from '../utils/logger.js';
import asyncHandler from '../utils/asyncHandler.js';
import { refundCredit } from '../utils/credits.js';
import { mapProviderError, penlixUnavailableMessage } from '../utils/quotaMessages.js';

const checkKey = () => {
  if (!process.env.GEMINI_API_KEY) {
    // Real cause stays in the log; users only ever see the Penlix message.
    logger.error('AI API key is not configured on the server.');
    const err = new Error(penlixUnavailableMessage());
    err.statusCode = 503;
    throw err;
  }
};

// Unknown subtypes are treated as the default for that type so old clients
// (which send no subtype) keep working.
const normalizeSubtype = (type, subtype) => {
  const allowed = ALLOWED_SUBTYPES[type] || [];
  return allowed.includes(subtype) ? subtype : '';
};

// SEO keywords drive the Unsplash search; when the SEO step yields none
// (failed call), fall back to the topic/prompt words so the blog still gets
// photos instead of silently shipping with none.
const blogKeywords = (seoData, prompt, details = {}) => {
  const fromSeo = seoData?.imageKeywords || seoData?.keywords || [];
  if (fromSeo.length) return fromSeo;
  const stop = new Set(['write', 'short', 'long', 'blog', 'about', 'with', 'your', 'this', 'that', 'and', 'the', 'for', 'how', 'what']);
  const text = `${details.topic || ''} ${prompt || ''}`.toLowerCase().replace(/[^a-z0-9 ]/g, ' ');
  return [...new Set(text.split(/\s+/).filter((w) => w.length > 2 && !stop.has(w)))].slice(0, 4);
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

const generateContentData = async ({ type, prompt, tone = 'professional', length = 'medium', language = 'english_us', format = 'paragraphs', details = {}, purpose = '', readingLevel = 'standard', writingSample = '', subtype = '' }) => {
  checkKey();

  // Two-pass + quality-checked generation: pass 1 drafts, pass 2 edits,
  // then checkQuality runs; a failed check retries once. Only the final
  // text is used, and only 1 credit is deducted by the caller.
  // The prompt is included in `input` so the invented-figure check can
  // tell numbers the user supplied apart from numbers the model made up.
  const { text: rawOutput, qualityReport } = await generateWithQualityCheck(
    runTwoPassDraft(generateText, { type, purpose }),
    {
      prompt: buildPrompt({ type, prompt, tone, length, language, format, details, purpose, readingLevel, writingSample, subtype }),
      type,
      purpose,
      input: { ...details, prompt },
      length,
    }
  );
  const { cleanContent, realityCheck } = parseRealityCheck(rawOutput);
  const seoData = await generateSEO(cleanContent);
  const keywords = blogKeywords(seoData, prompt, details);

  let images = [];
  let imageOptions = [];
  let finalOutput = cleanContent;

  if (type === 'blog' && process.env.UNSPLASH_ACCESS_KEY) {
    // 6 candidates: the first 3 are embedded, all 6 are offered in the picker.
    const candidates = await fetchAndAnalyzeImages(keywords);
    imageOptions = candidates;
    images = candidates.slice(0, 3);
    if (images.length) finalOutput = await embedImagesInContent(cleanContent, images);
  } else {
    images = await fetchImages(keywords);
  }

  return {
    data: {
      type,
      subtype,
      prompt,
      output: finalOutput,
      creditsUsed: 1,
      language,
      format,
      seoData,
      images,
      imageOptions,
      updatedAt: new Date(),
    },
    realityCheck,
    qualityReport,
  };
};

// ── Streaming generation via SSE ─────────────────────────────────
// Streaming approach: pass 1 streams live token-by-token (the UI keeps
// working exactly as before), then pass 2 runs as one non-streaming editor
// call after the stream ends, and the `done` event replaces the streamed
// text with the edited final text (contentWithImages). This was chosen
// over streaming pass 2 because the editor needs the whole draft before
// it can fix repeated patterns, and because the frontend already replaces
// its output on `done` — so no UI change was needed and the user never
// sees a half-edited stream.
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
    const { type, prompt, tone, length, language = 'english_us', format = 'paragraphs', purpose = '', readingLevel = 'standard', writingSample = '', subtype: rawSubtype, ...details } = req.body;
    const subtype = normalizeSubtype(type, rawSubtype);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const sendEvent = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    const fullPrompt = buildPrompt({ type, prompt, tone, length, language, format, details, purpose, readingLevel, writingSample, subtype });

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
      // Provider detail stays in the log; the SSE error is Penlix-branded.
      // The credit was reserved by the middleware, so a stream failure
      // must give it back (refundOnce guards double refunds).
      const mapped = mapProviderError(err);
      logger.error({ msg: msg.slice(0, 200) }, 'AI stream error');
      await refundOnce();
      sendEvent({ error: mapped.message, retryAfter: mapped.retryAfter });
      res.end();
      return;
    }

    if (!fullOutput) {
      await refundOnce();
      sendEvent({ error: 'No content was generated. Please try again.' });
      res.end();
      return;
    }

    // Split clean content from Reality Check section (kept from pass 1 —
    // the editor pass only edits the clean content, never the scores).
    // Any leaked "Agent 1/2" role labels are stripped before the text is
    // checked, saved or shown.
    fullOutput = stripAgentLabels(fullOutput);
    let { cleanContent, realityCheck } = parseRealityCheck(fullOutput);

    // Pass 2 (editor pass) on the streamed draft, then quality-check the
    // edited text. Only the final text is saved — and only 1 credit is
    // deducted for the whole request, passes and retries included.
    try {
      sendEvent({ status: 'Polishing the draft...' });
      cleanContent = await runEditorPass(generateText, cleanContent, { type, purpose });
    } catch (err) {
      logger.error({ err: err.message }, 'Editor pass failed; keeping streamed draft');
    }
    fullOutput = cleanContent;

    let qualityReport = checkQuality(cleanContent, { type, purpose, input: req.body, length });
    if (!qualityReport.passed) {
      sendEvent({ status: 'Quality check flagged issues — regenerating once...' });
      try {
        const retry = await retryGeneration(generateText, {
          prompt: fullPrompt,
          firstText: fullOutput,
          firstReport: qualityReport,
          type,
          purpose,
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

    // Final safety net: the saved output must never contain a bracketed
    // placeholder, even if the editor pass and the retry could not remove
    // one. Re-check after sanitizing so the report matches the saved text.
    const sanitizedContent = sanitizePlaceholders(cleanContent);
    if (sanitizedContent !== cleanContent) {
      cleanContent = sanitizedContent;
      qualityReport = checkQuality(cleanContent, { type, purpose, input: req.body, length });
    }

    // The editor pass runs through generateText, whose system message
    // appends a fresh REALITY CHECK table — strip it (and take its scores
    // only if pass 1 produced none) so it never leaks into the saved output.
    const reparsed = parseRealityCheck(cleanContent);
    cleanContent = reparsed.cleanContent;
    if (!realityCheck && reparsed.realityCheck) realityCheck = reparsed.realityCheck;

    // Post-generation: SEO + images + save
    try {
      const seoData = await generateSEO(cleanContent);
      const keywords = blogKeywords(seoData, prompt, details);

      let images = [];
      let imageOptions = [];
      let finalOutput = cleanContent;

      if (type === 'blog' && process.env.UNSPLASH_ACCESS_KEY) {
        sendEvent({ status: 'Fetching and analyzing images...' });
        const candidates = await fetchAndAnalyzeImages(keywords);
        imageOptions = candidates;
        images = candidates.slice(0, 3);
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
          subtype,
          prompt,
          output: finalOutput,
          creditsUsed: 1,
          language,
          format,
          seoData,
          images,
          imageOptions,
        }),
        // NOTE: no $inc here anymore — the credit was reserved by the middleware.
        Credit.create({ user: userId, amount: -1, type: 'usage', description: `Generated ${type} content` }),
      ]);

      sendEvent({ done: true, seoData, images, imageOptions, contentWithImages: finalOutput, realityCheck, contentId: content._id, qualityReport });
    } catch (err) {
      logger.error({ err: err.message }, 'Content save error');
      await refundOnce();
      sendEvent({ error: 'Content generated but failed to save. Please try again.' });
    }

    res.end();
  } catch (err) {
    await refundOnce();
    if (!res.headersSent) throw err;
    // Headers already sent (SSE in progress): never leak a raw provider or
    // database message to the client — send a Penlix-branded error instead.
    const mapped = mapProviderError(err);
    logger.error({ err: err.message }, 'Stream failed after headers sent');
    res.write(`data: ${JSON.stringify({ error: mapped.message, retryAfter: mapped.retryAfter })}\n\n`);
    res.end();
  }
});

// ── Non-streaming generate (fallback) ───────────────────────────
export const generate = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    checkKey();
    const { type, prompt, tone, length, language = 'english_us', format = 'paragraphs', purpose = '', readingLevel = 'standard', writingSample = '', subtype: rawSubtype, ...details } = req.body;
    const subtype = normalizeSubtype(type, rawSubtype);


    // Two-pass + quality-checked generation: retries once if the first draft
    // fails the check. Only the final text is saved and only 1 credit deducted.
    const { text: rawOutput, qualityReport } = await generateWithQualityCheck(
      runTwoPassDraft(generateText, { type, purpose }),
      {
        prompt: buildPrompt({ type, prompt, tone, length, language, format, details, purpose, readingLevel, writingSample, subtype }),
        type,
        purpose,
        input: req.body,
        length,
      }
    );
    const { cleanContent, realityCheck } = parseRealityCheck(rawOutput);


    const seoData = await generateSEO(cleanContent);
    const keywords = blogKeywords(seoData, prompt, details);

    let images = [];
    let imageOptions = [];
    let finalOutput = cleanContent;

    if (type === 'blog' && process.env.UNSPLASH_ACCESS_KEY) {
      const candidates = await fetchAndAnalyzeImages(keywords);
      imageOptions = candidates;
      images = candidates.slice(0, 3);
      if (images.length) finalOutput = await embedImagesInContent(cleanContent, images);
    } else {
      images = await fetchImages(keywords);
    }

    const [content] = await Promise.all([
      Content.create({ user: userId, type, subtype, prompt, output: finalOutput, creditsUsed: 1, language, format, seoData, images, imageOptions }),
      // NOTE: no $inc here anymore — the credit was reserved by the middleware.
      Credit.create({ user: userId, amount: -1, type: 'usage', description: `Generated ${type} content` }),
    ]);

    res.status(200).json({ content, realityCheck, qualityReport });
  } catch (err) {
    // Generation or save failed: give the reserved credit back.
    // checkKey is inside the try too — a missing API key must not cost a credit.
    if (req.creditReserved) await refundCredit(userId, req.creditReserved);
    throw err;
  }
});

// ── Generate from an uploaded image (non-streaming) ──────────────
// POST /api/generate/with-image — multipart/form-data with the same text
// fields as /stream plus one "image" file (JPG/PNG/WebP, max 5 MB).
// The image is sent to Gemini for this one generation only and is never
// stored in MongoDB. Exactly 1 credit is deducted, like a normal generation.
// No prompt or details are needed: with a photo attached the server
// supplies neutral defaults, so upload → pick a type → submit just works
// (ChatGPT-style). The strict generateSchema below is unchanged.
export const generateFromImage = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  // The credit was reserved by the middleware before this handler ran.
  // Any failure exit below must give it back (refundOnce guards double
  // refunds) — same rule as generate/streamGenerate.
  let refunded = false;
  const refundOnce = async () => {
    if (req.creditReserved && !refunded) {
      refunded = true;
      await refundCredit(userId, req.creditReserved);
    }
  };

  const imageError = validateImageFile(req.file);
  if (imageError) {
    await refundOnce();
    return res.status(400).json({ message: imageError });
  }

  const { error, value } = generateSchema.validate(applyImageDefaults(req.body));
  if (error) {
    await refundOnce();
    return res.status(400).json({ message: error.details[0].message });
  }
  const { type, prompt, tone, length, language = 'english_us', format = 'paragraphs', subtype: rawSubtype, ...details } = value;
  const subtype = normalizeSubtype(type, rawSubtype);

  try {
    checkKey();

    const imagePart = { data: req.file.buffer.toString('base64'), mimeType: req.file.mimetype };
    const fullPrompt = buildPrompt({ type, prompt, tone, length, language, format, subtype, details });
    const { text: rawOutput, qualityReport } = await generateWithQualityCheck(
      (p) => generateWithImage(p, imagePart),
      { prompt: fullPrompt, type, input: req.body, length }
    );
    const { cleanContent, realityCheck } = parseRealityCheck(rawOutput);

    const seoData = await generateSEO(cleanContent);
    const keywords = blogKeywords(seoData, prompt, details);

    let images = [];
    let imageOptions = [];
    let finalOutput = cleanContent;

    if (type === 'blog' && process.env.UNSPLASH_ACCESS_KEY) {
      const candidates = await fetchAndAnalyzeImages(keywords);
      imageOptions = candidates;
      images = candidates.slice(0, 3);
      if (images.length) finalOutput = await embedImagesInContent(cleanContent, images);
    } else {
      images = await fetchImages(keywords);
    }

    const [content] = await Promise.all([
      Content.create({ user: userId, type, subtype, prompt, output: finalOutput, creditsUsed: 1, language, format, seoData, images, imageOptions }),
      // NOTE: no $inc here anymore — the credit was reserved by the middleware.
      Credit.create({ user: userId, amount: -1, type: 'usage', description: `Generated ${type} content (with image)` }),
    ]);

    res.status(200).json({ content, realityCheck, qualityReport });
  } catch (err) {
    // Generation or save failed: give the reserved credit back.
    await refundOnce();
    throw err;
  }
});

// ── Tune existing content (1 credit) ────────────────────────────
// Input is validated by tuneSchema in the route (text capped at 5000
// characters, action from a fixed list) BEFORE the credit is reserved, so
// a bad request never costs a credit. The credit was reserved by the
// middleware before this handler ran; a generation failure below must
// give it back.
export const tuneContent = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  try {
    checkKey();
    const { text, action } = req.body;
    const raw = await tuneText(text, action);
    const { cleanContent, realityCheck } = parseRealityCheck(stripAgentLabels(raw));

    // NOTE: no $inc here — the credit was reserved by the middleware.
    // The ledger entry records the spend.
    await Credit.create({ user: userId, amount: -1, type: 'usage', description: `Tuned content (${action})` });

    res.status(200).json({ output: cleanContent, realityCheck });
  } catch (err) {
    // Tuning failed: give the reserved credit back.
    if (req.creditReserved) await refundCredit(userId, req.creditReserved);
    throw err;
  }
});

// ── RAG-augmented generation ─────────────────────────────────────
// The credit was reserved atomically by the middleware before this handler
// ran (reserveCredit), so two concurrent requests can never both pass on
// the same last credit. Any failure exit below must give it back.
export const generateAIContent = asyncHandler(async (req, res) => {
  try {
    checkKey();
    const { userPrompt, topicKeywords = [] } = req.body;
    if (!userPrompt) {
      // Bad request, no generation ran: give the reserved credit back.
      if (req.creditReserved) await refundCredit(req.user._id, req.creditReserved);
      return res.status(400).json({ message: 'userPrompt is required' });
    }

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
    // check. (Two-pass is not applied here — RAG answers are grounded in
    // retrieved context, not purpose templates.)
    const { text: raw, qualityReport } = await generateWithQualityCheck(generateText, {
      prompt: finalPrompt,
      type: 'general',
      input: {},
      length: 'medium',
    });
    const { cleanContent, realityCheck } = parseRealityCheck(stripAgentLabels(raw));

    // NOTE: no $inc here — the credit was reserved by the middleware.
    // The ledger entry records the spend. The RAG answer is saved as a
    // History entry (type 'rag') like every other generation, so it shows
    // up in Content History instead of vanishing after the response.
    const [content] = await Promise.all([
      Content.create({
        user: req.user._id,
        type: 'rag',
        prompt: userPrompt,
        output: cleanContent,
        creditsUsed: 1,
        language: 'english_us',
        format: 'paragraphs',
      }),
      Credit.create({ user: req.user._id, amount: -1, type: 'usage', description: 'Generated RAG content' }),
    ]);

    res.status(200).json({
      response: cleanContent,
      realityCheck,
      contextUsed: matchedContexts.length > 0,
      contextTitles: matchedContexts.map((c) => c.title),
      retrievalMethod,
      qualityReport,
      contentId: content._id,
    });
  } catch (err) {
    // Generation failed: give the reserved credit back.
    if (req.creditReserved) await refundCredit(req.user._id, req.creditReserved);
    throw err;
  }
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
      subtype: existing.subtype || '',
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

    res.status(200).json({ content, realityCheck, qualityReport });
  } catch (err) {
    // Regeneration failed: give the reserved credit back.
    if (req.creditReserved) await refundCredit(req.user._id, req.creditReserved);
    throw err;
  }
});
