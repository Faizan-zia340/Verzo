import { Router } from 'express';
import protect from '../middleware/auth.js';
import Content from '../models/Content.js';

const router = Router();

router.get('/', protect, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Content.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Content.countDocuments({ user: req.user._id }),
    ]);

    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', protect, async (req, res, next) => {
  try {
    await Content.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
