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
  // Daily upload counters (UTC day key 'YYYY-MM-DD'). Free users get
  // 10 image / 5 PDF uploads per day; paid (basic/pro) get 50 / 20 —
  // see server/utils/uploadLimits.js. Counts reset when the stored day
  // rolls over; accounts created before this field existed start empty
  // and are repaired on their first upload of the day.
  uploadCounts: {
    day: { type: String, default: '' },
    images: { type: Number, default: 0 },
    pdfs: { type: Number, default: 0 },
  },
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
  // Login lockout: 5 failed sign-in attempts lock the account for 15
  // minutes (see server/utils/loginSecurity.js). The counter resets when
  // the lock is set, and a successful sign-in clears both fields.
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  // Two-step verification (email OTP): opt-in for users, mandatory for
  // admins. Only the SHA-256 hash of the 6-digit sign-in code is stored,
  // never the raw code. Expires about 10 minutes after it is issued.
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorCode: { type: String },
  twoFactorExpires: { type: Date },
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
