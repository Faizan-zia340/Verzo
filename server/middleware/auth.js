import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// A token is stale when it was issued before the user's last password
// change (token `iat` is seconds; passwordChangedAt is a Date). Pure, so
// it is unit-testable without a database.
export const isTokenStale = (decoded, user) => {
  if (!user?.passwordChangedAt || !decoded?.iat) return false;
  return decoded.iat * 1000 < new Date(user.passwordChangedAt).getTime();
};

const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    // A password reset invalidates every session issued before it.
    if (isTokenStale(decoded, req.user)) {
      return res.status(401).json({ message: 'Session expired. Please sign in again.' });
    }
    next();
  } catch (err) {
    res.status(401).json({ message: 'Not authorized, invalid token' });
  }
};

export default protect;
