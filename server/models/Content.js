import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, required: true, enum: ['blog', 'social', 'email', 'ad', 'product'] },
  prompt: { type: String, required: true },
  output: { type: String, required: true },
  language: { type: String, default: 'english_us' },
  format: { type: String, default: 'paragraphs' },
  seoData: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    keywords: [{ type: String }],
    imageKeywords: [{ type: String }],
  },
  images: [{
    dataUrl: { type: String, default: '' },
    url: { type: String, default: '' },
    thumb: { type: String, default: '' },
    alt: { type: String, default: '' },
    credit: { type: String, default: '' },
    creditUrl: { type: String, default: '' },
    photographer: { type: String, default: '' },
    photographerUrl: { type: String, default: '' },
    extractedText: { type: String, default: '' },
    geminiDescription: { type: String, default: '' },
  }],
  creditsUsed: { type: Number, default: 1 },
  favorite: { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('Content', contentSchema);
