import { PDFParse } from 'pdf-parse';
import { getModel, withSystem } from '../utils/gemini.js';
import { buildPDFPrompt } from '../utils/prompts.js';
import logger from '../utils/logger.js';

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

export const analyzePDF = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No PDF file uploaded.' });

    let rawText = '';
    let numPages = 0;
    try {
      const extracted = await extractPDFText(req.file.buffer);
      // Handle both string and object returns
      rawText = (typeof extracted.text === 'string' ? extracted.text : String(extracted.text)).trim();
      numPages = extracted.numPages;
    } catch (parseErr) {
      logger.error({ err: parseErr.message }, 'PDF parse error');
      return res.status(422).json({ message: 'Could not read this PDF. Make sure it is a text-based (not scanned) PDF.' });
    }

    logger.info(`PDF extracted ${rawText.length} chars, ${numPages} pages from ${req.file.originalname}`);

    if (!rawText || rawText.length < 50) {
      return res.status(422).json({ message: 'PDF appears empty or unreadable. Try a text-based PDF.' });
    }

    const chunks = chunkText(rawText);
    const model = getModel();

    let analysisText = '';
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

    logger.debug(`PDF Gemini response (first 300 chars): ${analysisText.slice(0, 300)}`);

    res.json({
      pages: numPages,
      wordCount: rawText.split(/\s+/).length,
      charCount: rawText.length,
      chunks: chunks.length,
      analysis: analysisText,
    });
  } catch (err) {
    logger.error({ err: err.message }, 'PDF controller error');
    next(err);
  }
};
