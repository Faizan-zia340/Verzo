// server/middleware/uploadLimit.js
// Daily upload-count guard (see server/utils/uploadLimits.js for the
// limits). Must run AFTER multer — a file rejected by validation never
// reaches the counter — and BEFORE reserveCredit — an over-limit upload
// never reserves a credit. Skips when there is no file, so the handler
// can return its own 400 for a missing file without counting anything.
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import {
  createUploadLimiter,
  secondsUntilMidnightUTC,
  uploadLimitMessage,
} from '../utils/uploadLimits.js';

const limiter = createUploadLimiter(User);

const uploadLimit = (kind) =>
  asyncHandler(async (req, res, next) => {
    if (!req.file) return next();
    const subscription = req.user?.subscription || 'free';
    const result = await limiter.checkAndCount(req.user._id, subscription, kind);
    if (!result.allowed) {
      return res.status(429).json({
        message: uploadLimitMessage(subscription, kind, result.limit),
        retryAfter: secondsUntilMidnightUTC(),
        limit: result.limit,
        used: result.used,
      });
    }
    next();
  });

export default uploadLimit;
