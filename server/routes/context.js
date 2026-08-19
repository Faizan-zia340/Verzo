import { Router } from 'express';
import Context from '../models/Context.js';
import { generateEmbedding } from '../utils/embeddings.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();
const CACHE_TTL_MS = 10 * 60 * 1000;
let contextsCache = { data: null, expiresAt: 0 };

router.post('/', asyncHandler(async (req, res) => {
  const { title, keywords, information } = req.body;
  const embedding = await generateEmbedding(information);
  const context = await Context.create({ title, keywords, information, embedding: embedding || undefined });
  contextsCache = { data: null, expiresAt: 0 };
  res.status(201).json({ message: 'Context saved successfully', context: { ...context.toObject(), embedding: undefined } });
}));

router.get('/', asyncHandler(async (req, res) => {
  if (contextsCache.data && contextsCache.expiresAt > Date.now()) {
    return res.status(200).json(contextsCache.data);
  }
  const contexts = await Context.find().sort({ createdAt: -1 });
  contextsCache = { data: contexts, expiresAt: Date.now() + CACHE_TTL_MS };
  res.status(200).json(contexts);
}));

export default router;
