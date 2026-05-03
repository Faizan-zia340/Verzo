import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true, enum: ['blog', 'social', 'email', 'ad', 'product'] },
  prompt: { type: String, required: true },
  output: { type: String, required: true },
  language: { type: String, default: 'english' },
  seoData: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    keywords: [{ type: String }],
  },
  creditsUsed: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Content', contentSchema);
