import { Router } from 'express';
import mongoose from 'mongoose';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import protect from '../middleware/auth.js';
import isAdmin from '../middleware/isAdmin.js';
import userRateLimit from '../middleware/userRateLimit.js';
import asyncHandler from '../utils/asyncHandler.js';
import Suggestion from '../models/Suggestion.js';
import {
  validateSuggestionInput,
  canDecideSuggestion,
  glossarySnippet,
  SUGGESTION_LANGUAGES,
} from '../utils/suggestionValidation.js';

const router = Router();
const suggestLimit = userRateLimit(10, 'Suggestion');

// The glossary lives in the client content folder; the server writes the
// approved term straight into it (no more manual copy-paste).
export const GLOSSARY_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../client/src/content/glossary.json'
);

// Adds (or extends) one term in glossary.json, creating the file with an
// empty `terms` map when it does not exist yet. `filePath` is only for
// tests — production always uses GLOSSARY_PATH.
export const persistApprovedTerm = async ({ word, language, suggestedTranslation }, filePath = GLOSSARY_PATH) => {
  let glossary = { languages: SUGGESTION_LANGUAGES, terms: {} };
  try {
    glossary = JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  glossary.terms = glossary.terms || {};
  const term = glossary.terms[word] || { translations: {} };
  term.translations = term.translations || {};
  term.translations[language] = suggestedTranslation;
  glossary.terms[word] = term;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(glossary, null, 2)}\n`);
  return glossary.terms[word];
};

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
// Approving writes the term into glossary.json first — if the write fails
// the suggestion stays pending so the admin can retry. Rejecting stores
// the reason on the record (from `reason` or `rejectReason`).
const decide = (toStatus) => asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ message: 'Suggestion not found' });
  }
  const suggestion = await Suggestion.findById(req.params.id);
  const block = canDecideSuggestion(suggestion);
  if (block) return res.status(block.status).json({ message: block.message });
  if (toStatus === 'approved') await persistApprovedTerm(suggestion);
  suggestion.status = toStatus;
  suggestion.reviewedBy = req.user._id;
  if (toStatus === 'rejected') {
    const reason = req.body?.reason ?? req.body?.rejectReason;
    suggestion.rejectReason = typeof reason === 'string' ? reason.trim().slice(0, 300) : '';
  }
  await suggestion.save();
  const out = suggestion.toObject();
  if (toStatus === 'approved') out.glossary = glossarySnippet(suggestion);
  res.status(200).json(out);
});

router.post('/suggestions/:id/approve', protect, isAdmin, decide('approved'));
router.post('/suggestions/:id/reject', protect, isAdmin, decide('rejected'));

export default router;
