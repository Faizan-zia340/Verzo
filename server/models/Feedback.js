import mongoose from 'mongoose';

// Temporary testing feedback: a tester (logged in or anonymous) reports
// an issue from any page, and the admin reads it in the admin panel.
const feedbackSchema = new mongoose.Schema({
  page: { type: String, required: true, trim: true, maxlength: 500 },
  category: { type: String, enum: ['Bug', 'Suggestion', 'Other'], default: 'Other', index: true },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  name: { type: String, default: '', trim: true, maxlength: 100 },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

feedbackSchema.index({ createdAt: -1 });

export default mongoose.model('Feedback', feedbackSchema);
