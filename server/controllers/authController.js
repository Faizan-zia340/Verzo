import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  credits: user.credits,
  subscription: user.subscription,
  isAdmin: user.isAdmin === true,
});

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);
    res.status(201).json({ token, user: formatUser(user) });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = generateToken(user._id);
    res.json({ token, user: formatUser(user) });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res) => {
  res.json(formatUser(req.user));
};
