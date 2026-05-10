import { PDFParse } from 'pdf-parse';
import { getModel, withSystem } from '../utils/gemini.js';
import { buildPDFPrompt } from '../utils/prompts.js';

const CHUNK_SIZE = 6000;

const extractPDFText = async (buffer) => {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  await parser.load();
  const result = await parser.getText();
  const numPages = parser.doc?.numPages ?? 0;
  await parser.destroy();
  return { text: result.text || '', numPages };
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
      rawText = extracted.text.trim();
      numPages = extracted.numPages;
    } catch (parseErr) {
      console.error('[PDF Parse Error]', parseErr.message);
      return res.status(422).json({ message: 'Could not read this PDF. Make sure it is a text-based (not scanned) PDF.' });
    }

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

    res.json({
      pages: numPages,
      wordCount: rawText.split(/\s+/).length,
      charCount: rawText.length,
      chunks: chunks.length,
      analysis: analysisText,
    });
  } catch (err) {
    console.error('[PDF Controller Error]', err.message);
    next(err);
  }
};
