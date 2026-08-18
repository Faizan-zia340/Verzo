import { Router } from 'express';
import Context from '../models/Context.js';
import { generateEmbedding } from '../utils/embeddings.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.post('/', asyncHandler(async (req, res) => {
  const { title, keywords, information } = req.body;
  const embedding = await generateEmbedding(information);
  const context = await Context.create({ title, keywords, information, embedding: embedding || undefined });
  res.status(201).json({ message: 'Context saved successfully', context: { ...context.toObject(), embedding: undefined } });
}));

router.get('/', asyncHandler(async (req, res) => {
  const contexts = await Context.find().sort({ createdAt: -1 });
  res.status(200).json(contexts);
}));

export default router;
