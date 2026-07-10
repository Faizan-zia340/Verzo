import mongoose from 'mongoose';

const contextSchema = new mongoose.Schema({
  title: { type: String, required: true },
  keywords: [{ type: String }],
  information: { type: String, required: true },
  embedding: { type: [Number], default: undefined, select: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Context', contextSchema);
