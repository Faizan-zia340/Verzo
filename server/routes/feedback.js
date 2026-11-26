import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Feedback from '../models/Feedback.js';
import protect from '../middleware/auth.js';
import isAdmin from '../middleware/isAdmin.js';
import asyncHandler from '../utils/asyncHandler.js';
import { validateFeedbackInput } from '../utils/feedbackValidation.js';

const router = Router();

// Logged-in testers are linked to their account; anonymous testers are
// welcome too — a missing or invalid token never blocks a submission.
const optionalAuth = async (req, _res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) return next();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('_id');
  } catch {
    // Anonymous submission — no user attached.
  }
  next();
};

// Spam guard for the public form: 10 submissions per hour per IP.
const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many feedback submissions. Please try again later.' },
});

// Public: anyone (logged in or not) can report an issue. No credit charged.
router.post('/', feedbackLimiter, optionalAuth, asyncHandler(async (req, res) => {
  const result = validateFeedbackInput(req.body);
  if (result.error) return res.status(400).json({ message: result.error });
  const feedback = await Feedback.create({ ...result.value, user: req.user?._id || null });
  res.status(201).json({ message: 'Thanks for your feedback.', id: feedback._id });
}));

// Admin only: newest first, capped at 100.
router.get('/', protect, isAdmin, asyncHandler(async (req, res) => {
  const feedback = await Feedback.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('user', 'name email')
    .select('page category message name user createdAt');
  res.status(200).json(feedback);
}));

export default router;
