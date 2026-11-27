import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { FREE_SIGNUP_CREDITS } from '../config/pricing.js';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, index: { unique: true }, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  credits: { type: Number, default: FREE_SIGNUP_CREDITS },
  subscription: { type: String, enum: ['free', 'basic', 'pro'], default: 'free' },
  lastFreeCreditResetAt: { type: Date },
  stripeCustomerId: { type: String },
  isAdmin: { type: Boolean, default: false },
  // Email verification: a new account starts UNVERIFIED (registration sets
  // this to false explicitly) and only gets the 20 signup credits when the
  // verify link is clicked. The default is `true` on purpose — accounts
  // created before verification existed have no such field, and they must
  // keep working as verified. The server and the API response treat a
  // missing/undefined value as verified (see formatUser in
  // authController.js, which coerces `!== false`).
  isEmailVerified: { type: Boolean, default: true },
  // Only the SHA-256 hash of the verification token is stored, never the
  // raw token — same pattern as the forgot-password token. Expires about
  // 24 hours after it is issued.
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },
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
