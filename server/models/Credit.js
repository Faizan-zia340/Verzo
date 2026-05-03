import mongoose from 'mongoose';

const creditSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['purchase', 'usage', 'bonus'], required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Credit', creditSchema);
