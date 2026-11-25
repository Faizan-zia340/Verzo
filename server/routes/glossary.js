import { Router } from 'express';
import mongoose from 'mongoose';
import protect from '../middleware/auth.js';
import isAdmin from '../middleware/isAdmin.js';
import userRateLimit from '../middleware/userRateLimit.js';
import asyncHandler from '../utils/asyncHandler.js';
import Suggestion from '../models/Suggestion.js';
import {
  validateSuggestionInput,
  canDecideSuggestion,
  glossarySnippet,
} from '../utils/suggestionValidation.js';

const router = Router();
const suggestLimit = userRateLimit(10, 'Suggestion');

// Suggest a translation for a word. Free — no credit cost. One pending
// suggestion per user per word+language; a repeat returns 409.
router.post('/suggest', protect, suggestLimit, asyncHandler(async (req, res) => {
  const error = validateSuggestionInput(req.body);
  if (error) return res.status(400).json({ message: error });
  const word = req.body.word.trim();
  const { language } = req.body;
  const suggestedTranslation = req.body.suggestedTranslation.trim();
  const note = typeof req.body.note === 'string' ? req.body.note.trim() : '';
  const existing = await Suggestion.findOne({
    suggestedBy: req.user._id,
    language,
    wordKey: word.toLowerCase(),
    status: 'pending',
  }).select('_id');
  if (existing) {
    return res.status(409).json({
      message: 'You already have a pending suggestion for this word and language',
      suggestionId: existing._id,
    });
  }
  const suggestion = await Suggestion.create({
    word,
    wordKey: word.toLowerCase(),
    language,
    suggestedTranslation,
    note,
    suggestedBy: req.user._id,
  });
  res.status(201).json(suggestion);
}));

// Admin review queue. ?status=pending|approved|rejected, newest first.
router.get('/suggestions', protect, isAdmin, asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = ['pending', 'approved', 'rejected'].includes(status) ? { status } : {};
  const suggestions = await Suggestion.find(filter)
    .sort({ createdAt: -1 })
    .populate('suggestedBy', 'name email')
    .limit(100);
  res.status(200).json(suggestions);
}));

// Approve/reject share one flow: only a pending suggestion can be decided.
// Approving does NOT edit glossary.json (a repo file) — the response
// carries the exact JSON snippet for an admin to copy in by hand.
const decide = (toStatus) => asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ message: 'Suggestion not found' });
  }
  const suggestion = await Suggestion.findById(req.params.id);
  const block = canDecideSuggestion(suggestion);
  if (block) return res.status(block.status).json({ message: block.message });
  suggestion.status = toStatus;
  suggestion.reviewedBy = req.user._id;
  if (toStatus === 'rejected') {
    suggestion.rejectReason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 300) : '';
  }
  await suggestion.save();
  const out = suggestion.toObject();
  if (toStatus === 'approved') out.glossary = glossarySnippet(suggestion);
  res.status(200).json(out);
});

router.post('/suggestions/:id/approve', protect, isAdmin, decide('approved'));
router.post('/suggestions/:id/reject', protect, isAdmin, decide('rejected'));

export default router;
