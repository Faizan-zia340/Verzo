import getClient from '../config/gemini.js';

const EMBED_MODEL = 'gemini-embedding-001';

export const generateEmbedding = async (text) => {
  if (!text || !process.env.GEMINI_API_KEY) return null;
  try {
    const genAI = getClient();
    const model = genAI.getGenerativeModel({ model: EMBED_MODEL }, { apiVersion: 'v1' });
    const result = await model.embedContent(text.slice(0, 8000));
    return result.embedding?.values || null;
  } catch (err) {
    console.error('[Embeddings] Failed to generate embedding:', err.message?.slice(0, 150));
    return null;
  }
};

export const cosineSimilarity = (a, b) => {
  if (!a || !b || a.length !== b.length) return -1;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return -1;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

const SIMILARITY_THRESHOLD = 0.65;

export const findRelevantContexts = async (queryText, contexts, topK = 3) => {
  const queryEmbedding = await generateEmbedding(queryText);
  if (!queryEmbedding) return { matches: [], usedEmbeddings: false };

  const scored = contexts
    .filter((c) => Array.isArray(c.embedding) && c.embedding.length)
    .map((c) => ({ context: c, score: cosineSimilarity(queryEmbedding, c.embedding) }))
    .filter((s) => s.score >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return { matches: scored.map((s) => s.context), usedEmbeddings: true, scores: scored.map((s) => s.score) };
};
