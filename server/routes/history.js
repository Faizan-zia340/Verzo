import { Router } from 'express';
import protect from '../middleware/auth.js';
import Content from '../models/Content.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.get('/', protect, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Content.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Content.countDocuments({ user: req.user._id }),
  ]);

  res.status(200).json({ items, total, page, pages: Math.ceil(total / limit) });
}));

router.delete('/:id', protect, asyncHandler(async (req, res) => {
  await Content.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.status(200).json({ success: true });
}));

export default router;
