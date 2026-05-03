import User from '../models/User.js';

export const getProfile = async (req, res) => {
  const { _id: id, name, email, credits, subscription, createdAt } = req.user;
  res.json({ id, name, email, credits, subscription, createdAt });
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, email }, { new: true, runValidators: true }).select('-password');
    res.json({ id: user._id, name: user.name, email: user.email, credits: user.credits, subscription: user.subscription });
  } catch (err) {
    next(err);
  }
};
