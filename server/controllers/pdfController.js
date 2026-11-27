import { PDFParse } from 'pdf-parse';
import { getModel, withSystem, geminiError } from '../utils/gemini.js';
import { buildPDFPrompt } from '../utils/prompts.js';
import Credit from '../models/Credit.js';
import logger from '../utils/logger.js';
import asyncHandler from '../utils/asyncHandler.js';
import { refundCredit } from '../utils/credits.js';

const CHUNK_SIZE = 6000;

const extractPDFText = async (buffer) => {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  await parser.load();
  const result = await parser.getText();
  const numPages = parser.doc?.numPages ?? 0;
  await parser.destroy();
  return { text: result.text || result || '', numPages };
};

const chunkText = (text) => {
  if (text.length <= CHUNK_SIZE) return [text];
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + CHUNK_SIZE, text.length);
    const breakAt = text.lastIndexOf('\n', end);
    const chunkEnd = breakAt > i ? breakAt : end;
    chunks.push(text.slice(i, chunkEnd).trim());
    i = chunkEnd + 1;
  }
  return chunks.filter(Boolean);
};

// POST /api/pdf/analyze — 1 credit per analysis (reserved by the
// middleware before this handler runs). A multi-chunk PDF costs up to 5
// AI calls, so it is charged like a generation, not given away free.
// Any failure exit below must give the credit back (refundOnce guards
// double refunds) — same rule as the generate routes.
export const analyzePDF = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  let refunded = false;
  const refundOnce = async () => {
    if (req.creditReserved && !refunded) {
      refunded = true;
      await refundCredit(userId, req.creditReserved);
    }
  };

  if (!req.file) {
    await refundOnce();
    return res.status(400).json({ message: 'No PDF file uploaded.' });
  }

  let rawText = '';
  let numPages = 0;
  try {
    const extracted = await extractPDFText(req.file.buffer);
    // Handle both string and object returns
    rawText = (typeof extracted.text === 'string' ? extracted.text : String(extracted.text)).trim();
    numPages = extracted.numPages;
  } catch (parseErr) {
    logger.error({ err: parseErr.message }, 'PDF parse error');
    await refundOnce();
    return res.status(422).json({ message: 'Could not read this PDF. Make sure it is a text-based (not scanned) PDF.' });
  }

  logger.info(`PDF extracted ${rawText.length} chars, ${numPages} pages from ${req.file.originalname}`);

  if (!rawText || rawText.length < 50) {
    await refundOnce();
    return res.status(422).json({ message: 'PDF appears empty or unreadable. Try a text-based PDF.' });
  }

  const chunks = chunkText(rawText);
  const model = getModel();

  // Any provider failure (quota, overload, bad key) is mapped to a
  // Penlix-branded error by geminiError — the raw message never reaches
  // the user.
  let analysisText = '';
  try {
    if (chunks.length === 1) {
      const result = await model.generateContent(withSystem(buildPDFPrompt(chunks[0])));
      analysisText = result.response.text();
    } else {
      const summaries = [];
      for (const chunk of chunks.slice(0, 4)) {
        const r = await model.generateContent(
          withSystem(`Summarize this section of a document into key bullet points and main ideas:\n\n${chunk}`)
        );
        summaries.push(r.response.text());
      }
      const combined = summaries.join('\n\n');
      const result = await model.generateContent(withSystem(buildPDFPrompt(combined)));
      analysisText = result.response.text();
    }
  } catch (err) {
    // Generation failed: give the reserved credit back, then map the error.
    await refundOnce();
    geminiError(err);
  }

  logger.debug(`PDF analysis response (first 300 chars): ${analysisText.slice(0, 300)}`);

  // NOTE: no $inc here — the credit was reserved by the middleware.
  // The ledger entry records the spend.
  await Credit.create({ user: userId, amount: -1, type: 'usage', description: 'Analyzed PDF' });

  res.status(200).json({
    pages: numPages,
    wordCount: rawText.split(/\s+/).length,
    charCount: rawText.length,
    chunks: chunks.length,
    analysis: analysisText,
  });
});
