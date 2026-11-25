import mongoose from 'mongoose';

// A user-suggested translation for a glossary term. Suggestions never
// touch glossary.json directly — an admin approves them first, and the
// approved JSON snippet is then copied into the file by hand.
const suggestionSchema = new mongoose.Schema({
  word: { type: String, required: true, trim: true, maxlength: 50 },
  // Lowercased word, for the per-user duplicate check.
  wordKey: { type: String, required: true, lowercase: true, trim: true, index: true },
  language: { type: String, required: true, index: true },
  suggestedTranslation: { type: String, required: true, trim: true, maxlength: 100 },
  note: { type: String, default: '', maxlength: 300 },
  suggestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  rejectReason: { type: String, default: '' },
}, { timestamps: true });

suggestionSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Suggestion', suggestionSchema);
