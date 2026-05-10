import { Router } from 'express';
import protect from '../middleware/auth.js';
import isAdmin from '../middleware/isAdmin.js';
import User from '../models/User.js';
import Credit from '../models/Credit.js';
import Context from '../models/Context.js';
import Content from '../models/Content.js';

const router = Router();
router.use(protect, isAdmin);

// Stats overview
router.get('/stats', async (req, res, next) => {
  try {
    const [userCount, contextCount, totalGenerations, users] = await Promise.all([
      User.countDocuments(),
      Context.countDocuments(),
      Content.countDocuments(),
      User.find().select('credits'),
    ]);
    const totalCredits = users.reduce((sum, u) => sum + (u.credits || 0), 0);
    res.json({ userCount, totalCredits, contextCount, totalGenerations });
  } catch (err) {
    next(err);
  }
});

// Recent activity feed
router.get('/activity', async (req, res, next) => {
  try {
    const activity = await Content.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('user', 'name email')
      .select('type prompt language createdAt user');
    res.json(activity);
  } catch (err) {
    next(err);
  }
});

// User list
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

// Adjust user credits by ID
router.put('/users/:id/credits', async (req, res, next) => {
  try {
    const { credits } = req.body;
    if (typeof credits !== 'number') return res.status(400).json({ message: 'credits must be a number' });
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

// Grant credits by email
router.post('/grant-credits', async (req, res, next) => {
  try {
    const { email, credits } = req.body;
    if (!email || typeof credits !== 'number' || credits === 0) {
      return res.status(400).json({ message: 'Valid email and non-zero credits required' });
    }
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { $inc: { credits } },
      { new: true }
    ).select('name email credits');
    if (!user) return res.status(404).json({ message: 'No user found with that email' });
    await Credit.create({
      user: user._id,
      amount: credits,
      type: 'bonus',
      description: `Admin grant by email: +${credits} credits`,
    });
    res.json({ message: `Granted ${credits} credits to ${user.email}`, user });
  } catch (err) {
    next(err);
  }
});

// RAG context management
router.get('/contexts', async (req, res, next) => {
  try {
    const contexts = await Context.find().sort({ createdAt: -1 });
    res.json(contexts);
  } catch (err) {
    next(err);
  }
});

router.post('/contexts', async (req, res, next) => {
  try {
    const { title, keywords, information } = req.body;
    if (!title || !information) return res.status(400).json({ message: 'title and information are required' });
    const context = await Context.create({ title, keywords: keywords || [], information });
    res.status(201).json(context);
  } catch (err) {
    next(err);
  }
});

router.delete('/contexts/:id', async (req, res, next) => {
  try {
    await Context.findByIdAndDelete(req.params.id);
    res.json({ message: 'Context deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
