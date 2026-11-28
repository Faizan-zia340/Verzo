import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { createVerificationToken } from '../utils/emailVerification.js';
import { sendVerificationEmail } from '../utils/sendEmail.js';

// Name changes apply immediately. An email change needs the current
// password and must not collide with another account (409, not 500) —
// and the address itself only changes after the verification link sent
// to the NEW address is clicked (authController.verifyEmail applies the
// pending address). Until then the old address stays in place.
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, currentPassword } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (typeof name === 'string' && name.trim()) user.name = name.trim();

  const newEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (newEmail && newEmail !== user.email) {
    if (!currentPassword) {
      return res.status(400).json({ message: 'Current password is required to change your email' });
    }
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    if (await User.findOne({ email: newEmail, _id: { $ne: user._id } })) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    const { rawToken, tokenHash, expiresAt } = createVerificationToken();
    user.pendingEmail = newEmail;
    user.pendingEmailToken = tokenHash;
    user.pendingEmailExpires = expiresAt;
    await user.save();
    const base = (process.env.CLIENT_URL || 'https://verzo-ecru.vercel.app').replace(/\/$/, '');
    if (base) {
      await sendVerificationEmail({ to: newEmail, verifyUrl: `${base}/verify-email/${rawToken}` });
    }
    return res.status(200).json({
      id: user._id, name: user.name, email: user.email,
      credits: user.credits, subscription: user.subscription,
      pendingEmail: newEmail,
      message: 'Verification email sent to your new address. Your email will change once you confirm it.',
    });
  }

  await user.save();
  res.status(200).json({ id: user._id, name: user.name, email: user.email, credits: user.credits, subscription: user.subscription });
});

// Change password while signed in. The current password must match
// (401 if not) and the new one follows the same 6-character rule as
// registration/reset. Setting passwordChangedAt invalidates every JWT
// issued before this change — including the current session — exactly as
// the reset flow does, so the user signs in again with the new password.
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (!(await user.comparePassword(currentPassword))) {
    return res.status(401).json({ message: 'Current password is incorrect' });
  }
  // The User pre-save hook hashes the password (bcrypt, 12 rounds),
  // exactly as it does on registration and reset.
  user.password = newPassword;
  user.passwordChangedAt = new Date();
  await user.save();
  res.status(200).json({ message: 'Password changed. Please sign in again with your new password.' });
});
