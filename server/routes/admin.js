import { Router } from 'express';
import protect from '../middleware/auth.js';
import isAdmin from '../middleware/isAdmin.js';
import User from '../models/User.js';
import Credit from '../models/Credit.js';

const router = Router();

router.use(protect, isAdmin);

router.get('/users', async (req, res, next) => {
  try {
    const users = await User.find()
      .select('name email credits isAdmin subscription createdAt')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

router.put('/users/:id/credits', async (req, res, next) => {
  try {
    const { credits } = req.body;
    if (typeof credits !== 'number') {
      return res.status(400).json({ message: 'credits must be a number' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $inc: { credits } },
      { new: true }
    ).select('name email credits');

    if (!user) return res.status(404).json({ message: 'User not found' });

    await Credit.create({
      user: user._id,
      amount: credits,
      type: credits > 0 ? 'bonus' : 'usage',
      description: `Admin adjustment: ${credits > 0 ? '+' : ''}${credits} credits`,
    });

    res.json({ message: 'Credits updated', user });
  } catch (err) {
    next(err);
  }
});

export default router;
