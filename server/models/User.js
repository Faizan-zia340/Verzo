import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, index: { unique: true }, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  credits: { type: Number, default: 10 },
  subscription: { type: String, enum: ['free', 'basic', 'pro'], default: 'free' },
  lastFreeCreditResetAt: { type: Date },
  stripeCustomerId: { type: String },
  isAdmin: { type: Boolean, default: false },
  // Forgot-password: only the SHA-256 hash of the reset token is stored,
  // never the raw token. Expires about 1 hour after it is issued.
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
