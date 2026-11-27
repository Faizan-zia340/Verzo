// server/controllers/dataExportController.js
// GET /api/user/data-export — the requesting user's own data as a JSON
// download. Protected + rate-limited (5/hour per user) in the route.
// The payload is built by server/utils/dataExport.js, which only ever
// reads the requester's own rows and allowlists every field — password
// hashes, tokens and other users' data can never appear in it.
import Content from '../models/Content.js';
import Feedback from '../models/Feedback.js';
import Suggestion from '../models/Suggestion.js';
import asyncHandler from '../utils/asyncHandler.js';
import { buildUserDataExport } from '../utils/dataExport.js';

export const exportUserData = asyncHandler(async (req, res) => {
  // req.user comes from `protect`, which already excludes the password.
  const profile = {
    name: req.user.name,
    email: req.user.email,
    credits: req.user.credits,
    subscription: req.user.subscription,
    createdAt: req.user.createdAt,
  };
  const payload = await buildUserDataExport({ Content, Feedback, Suggestion }, req.user._id, profile);
  const filename = `penlix-data-${new Date().toISOString().slice(0, 10)}.json`;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).json(payload);
});
