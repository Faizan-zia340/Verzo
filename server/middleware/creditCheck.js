const creditCheck = (required = 1) => (req, res, next) => {
  if (req.user.credits < required) {
    return res.status(402).json({ message: 'Insufficient credits' });
  }
  next();
};

export default creditCheck;
