import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Feedback from '../models/Feedback.js';
import protect from '../middleware/auth.js';
import isAdmin from '../middleware/isAdmin.js';
import asyncHandler from '../utils/asyncHandler.js';
import { validateFeedbackInput } from '../utils/feedbackValidation.js';
import { sendFeedbackThanksEmail } from '../utils/sendEmail.js';

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
    .select('page category message name user status resolvedAt createdAt');
  res.status(200).json(feedback);
}));

// Admin only: mark a report fixed and thank the reporter by email.
// Idempotent: resolving twice sends no second email. Anonymous reports
// (or a reporter without an email) just resolve, no email, no error.
export const resolveFeedbackHandler = (sendMail = sendFeedbackThanksEmail) => asyncHandler(async (req, res) => {
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) return res.status(404).json({ message: 'Feedback not found.' });
  if (feedback.status === 'resolved') return res.status(200).json({ ...feedback.toObject(), emailSent: false });
  feedback.status = 'resolved';
  feedback.resolvedAt = new Date();
  await feedback.save();
  let emailSent = false;
  if (feedback.user) {
    const user = await User.findById(feedback.user).select('name email');
    if (user?.email) {
      emailSent = await sendMail({ to: user.email, name: user.name || feedback.name, category: feedback.category, page: feedback.page });
    }
  }
  res.status(200).json({ ...feedback.toObject(), emailSent });
});

router.patch('/:id/resolve', protect, isAdmin, resolveFeedbackHandler());

export default router;
