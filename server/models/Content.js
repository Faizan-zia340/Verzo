import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
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
}, { _id: false });

const contentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, required: true, enum: ['blog', 'social', 'email', 'ad', 'product', 'cover_letter', 'resume_summary', 'linkedin', 'rag'] },
  // Email category / social style used for this generation ('' = default).
  subtype: { type: String, default: '' },
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
  images: [imageSchema],
  // All Unsplash candidates fetched for a blog (usually 6). The blog image
  // picker swaps images[i] with imageOptions[j]; images[] holds the
  // currently embedded ones. Not stored for non-blog types.
  imageOptions: [imageSchema],
  creditsUsed: { type: Number, default: 1 },
  // Optional media saved with this history entry (Cloudinary). Only the URL
  // + public_id live here — the file itself is never stored in MongoDB.
  // mediaType '' = no media attached.
  mediaUrl: { type: String, default: '' },
  mediaPublicId: { type: String, default: '' },
  mediaType: { type: String, default: '', enum: ['', 'image', 'audio'] },
  favorite: { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('Content', contentSchema);
