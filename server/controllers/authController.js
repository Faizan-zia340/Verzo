import crypto from 'crypto';
import User from '../models/User.js';
import { generateToken, cookieOptions } from '../utils/jwt.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendPasswordResetEmail } from '../utils/sendEmail.js';

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  credits: user.credits,
  subscription: user.subscription,
  isAdmin: user.isAdmin === true,
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.findOne({ email })) {
    return res.status(400).json({ message: 'Email already in use' });
  }
  const user = await User.create({ name, email, password });
  const token = generateToken(user._id);
  res.cookie('token', token, cookieOptions());
  res.status(201).json({ user: formatUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  const token = generateToken(user._id);
  res.cookie('token', token, cookieOptions());
  res.status(200).json({ user: formatUser(user) });
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(formatUser(req.user));
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token', { ...cookieOptions(), maxAge: 0 });
  res.status(200).json({ message: 'Logged out' });
});

// Generic response on purpose: it must not reveal whether the email
// is registered, or whether an email was actually sent.
const GENERIC_FORGOT_MESSAGE = 'If an account exists with that email, a password reset link has been sent.';

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();
    // Use the calling frontend's origin when available (so a preview
    // deployment links back to itself), falling back to CLIENT_URL.
    const base = (req.get('origin') || process.env.CLIENT_URL || '').replace(/\/$/, '');
    if (base) {
      await sendPasswordResetEmail({
        to: user.email,
        resetUrl: `${base}/reset-password/${rawToken}`,
      });
    }
    // The raw token is never returned, logged, or stored.
  }
  res.status(200).json({ message: GENERIC_FORGOT_MESSAGE });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const tokenHash = crypto.createHash('sha256').update(req.params.token || '').digest('hex');
  const user = await User.findOne({
    resetPasswordToken: tokenHash,
    resetPasswordExpires: { $gt: new Date() },
  });
  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired reset link' });
  }
  // The User pre-save hook hashes the password (bcrypt, 12 rounds),
  // exactly as it does on registration.
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  res.status(200).json({ message: 'Password reset successfully. Please sign in.' });
});
