import crypto from 'crypto';
import User from '../models/User.js';
import { FREE_SIGNUP_CREDITS } from '../config/pricing.js';
import { generateToken, cookieOptions } from '../utils/jwt.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendPasswordResetEmail, sendVerificationEmail } from '../utils/sendEmail.js';
import { createVerificationToken, applyVerificationGrant } from '../utils/emailVerification.js';

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  credits: user.credits,
  subscription: user.subscription,
  isAdmin: user.isAdmin === true,
  // Accounts created before verification existed have no such field; a
  // missing value reads as verified so the 19 existing accounts are
  // unaffected. Only an explicit `false` (a new unverified registration)
  // reports as unverified.
  isEmailVerified: user.isEmailVerified !== false,
});

// Issues a fresh email-verification token for the user (only the SHA-256
// hash is stored, never the raw token — same pattern as forgot-password).
// Returns the raw token for the email link.
const issueVerificationToken = (user) => {
  const { rawToken, tokenHash, expiresAt } = createVerificationToken();
  user.emailVerificationToken = tokenHash;
  user.emailVerificationExpires = expiresAt;
  return rawToken;
};

// The verification link must NEVER be built from the request Origin —
// same rule as the reset link (see forgotPassword). Use only the trusted
// CLIENT_URL (falling back to the known production frontend).
const clientBaseUrl = () => (process.env.CLIENT_URL || 'https://verzo-ecru.vercel.app').replace(/\/$/, '');

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.findOne({ email })) {
    return res.status(400).json({ message: 'Email already in use' });
  }
  // A new account starts with 0 credits and unverified email. The 20 free
  // signup credits are granted only when the verify link is clicked — an
  // unverified account cannot generate (the credit reservation returns 402),
  // and the daily reset never tops up unverified accounts either.
  const user = await User.create({ name, email, password, credits: 0, isEmailVerified: false });
  const rawToken = issueVerificationToken(user);
  await user.save();
  const base = clientBaseUrl();
  if (base) {
    await sendVerificationEmail({
      to: user.email,
      verifyUrl: `${base}/verify-email/${rawToken}`,
    });
  }
  const token = generateToken(user._id);
  res.cookie('token', token, cookieOptions());
  res.status(201).json({
    user: formatUser(user),
    message: 'Account created. Please check your email to verify your address and get your 20 free credits.',
  });
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
    // SECURITY (C1): the reset link must NEVER be built from the request
    // Origin — an attacker could POST forgot-password with
    // Origin: https://evil.com and the email would link the victim to the
    // attacker's site carrying the real token. Use only the trusted
    // CLIENT_URL (falling back to the known production frontend).
    const base = (process.env.CLIENT_URL || 'https://verzo-ecru.vercel.app').replace(/\/$/, '');
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

// GET /api/auth/verify-email/:token — clicked from the verification email.
// Grants the 20 signup credits, but only once and only to an account that
// has not verified yet: the credit grant is a top-up to the free allowance
// (never a reduction), so an account that already holds 20 or more gains
// nothing by verifying again, and the cleared token cannot be reused.
export const verifyEmail = asyncHandler(async (req, res) => {
  const tokenHash = crypto.createHash('sha256').update(req.params.token || '').digest('hex');
  const user = await User.findOne({
    emailVerificationToken: tokenHash,
    emailVerificationExpires: { $gt: new Date() },
  });
  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired verification link' });
  }
  if (user.isEmailVerified !== false) {
    return res.status(200).json({ user: formatUser(user), message: 'Email already verified.' });
  }
  applyVerificationGrant(user);
  await user.save();
  res.status(200).json({
    user: formatUser(user),
    message: `Email verified. Your ${FREE_SIGNUP_CREDITS} free credits are ready.`,
  });
});

// POST /api/auth/resend-verification — logged-in user, still unverified.
// Issues a fresh token (the old one stops working) and re-sends the email.
// Already-verified accounts get a plain message and no email.
export const resendVerificationEmail = asyncHandler(async (req, res) => {
  const user = req.user;
  if (user.isEmailVerified !== false) {
    return res.status(200).json({ message: 'Email already verified.' });
  }
  const rawToken = issueVerificationToken(user);
  await user.save();
  const base = clientBaseUrl();
  if (base) {
    await sendVerificationEmail({
      to: user.email,
      verifyUrl: `${base}/verify-email/${rawToken}`,
    });
  }
  res.status(200).json({ message: 'Verification email sent. Please check your inbox.' });
});
