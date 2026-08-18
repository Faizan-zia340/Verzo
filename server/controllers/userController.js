import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getProfile = asyncHandler(async (req, res) => {
  const { _id: id, name, email, credits, subscription, createdAt } = req.user;
  res.status(200).json({ id, name, email, credits, subscription, createdAt });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  const user = await User.findByIdAndUpdate(req.user._id, { name, email }, { new: true, runValidators: true }).select('-password');
  res.status(200).json({ id: user._id, name: user.name, email: user.email, credits: user.credits, subscription: user.subscription });
});
