import { Router } from 'express';
import protect from '../middleware/auth.js';
import isAdmin from '../middleware/isAdmin.js';
import User from '../models/User.js';
import Credit from '../models/Credit.js';
import Context from '../models/Context.js';
import { generateEmbedding } from '../utils/embeddings.js';
import Content from '../models/Content.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();
router.use(protect, isAdmin);

// Stats overview
router.get('/stats', asyncHandler(async (req, res) => {
  const [userCount, contextCount, totalGenerations, users] = await Promise.all([
    User.countDocuments(),
    Context.countDocuments(),
    Content.countDocuments(),
    User.find().select('credits'),
  ]);
  const totalCredits = users.reduce((sum, u) => sum + (u.credits || 0), 0);
  res.status(200).json({ userCount, totalCredits, contextCount, totalGenerations });
}));

// Recent activity feed
router.get('/activity', asyncHandler(async (req, res) => {
  const activity = await Content.find()
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('user', 'name email')
    .select('type prompt language createdAt user');
  res.status(200).json(activity);
}));

// User list
router.get('/users', asyncHandler(async (req, res) => {
  const users = await User.find()
    .select('name email credits isAdmin subscription createdAt')
    .sort({ createdAt: -1 });
  res.status(200).json(users);
}));

// Adjust user credits by ID
router.put('/users/:id/credits', asyncHandler(async (req, res) => {
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
  res.status(200).json({ message: 'Credits updated', user });
}));

// Grant credits by email
router.post('/grant-credits', asyncHandler(async (req, res) => {
  const { email, credits } = req.body;
  if (typeof email !== 'string' || !email.trim() || typeof credits !== 'number' || credits === 0) {
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
  res.status(200).json({ message: `Granted ${credits} credits to ${user.email}`, user });
}));

// RAG context management
router.get('/contexts', asyncHandler(async (req, res) => {
  const contexts = await Context.find().sort({ createdAt: -1 });
  res.status(200).json(contexts);
}));

router.post('/contexts', asyncHandler(async (req, res) => {
  const { title, keywords, information } = req.body;
  if (!title || !information) return res.status(400).json({ message: 'title and information are required' });
  const embedding = await generateEmbedding(information);
  const context = await Context.create({ title, keywords: keywords || [], information, embedding: embedding || undefined });
  res.status(201).json({ ...context.toObject(), embedding: undefined });
}));

router.delete('/contexts/:id', asyncHandler(async (req, res) => {
  await Context.findByIdAndDelete(req.params.id);
  res.status(200).json({ message: 'Context deleted' });
}));

export default router;
