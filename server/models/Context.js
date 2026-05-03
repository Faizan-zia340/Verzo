import mongoose from 'mongoose';

const contextSchema = new mongoose.Schema({
  title: { type: String, required: true },
  keywords: [{ type: String }],
  information: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Context', contextSchema);
