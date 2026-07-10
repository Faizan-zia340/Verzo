import jwt from 'jsonwebtoken';

export const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const expiresInMs = () => {
  const raw = process.env.JWT_EXPIRES_IN || '7d';
  const match = /^(\d+)([smhd])$/.exec(raw);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * multipliers[unit];
};

export const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: expiresInMs(),
  path: '/',
});
