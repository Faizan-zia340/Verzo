import { Router } from 'express';
import protect from '../middleware/auth.js';
import Credit from '../models/Credit.js';

const router = Router();

router.get('/', protect, async (req, res, next) => {
  try {
    const logs = await Credit.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json({ credits: req.user.credits, logs });
  } catch (err) {
    next(err);
  }
});

export default router;
