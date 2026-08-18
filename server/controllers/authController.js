import User from '../models/User.js';
import { generateToken, cookieOptions } from '../utils/jwt.js';
import asyncHandler from '../utils/asyncHandler.js';

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
