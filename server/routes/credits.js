import { Router } from 'express';
import protect from '../middleware/auth.js';
import Credit from '../models/Credit.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.get('/', protect, asyncHandler(async (req, res) => {
  const logs = await Credit.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.status(200).json({ credits: req.user.credits, logs });
}));

export default router;
