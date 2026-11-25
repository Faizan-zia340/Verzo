// server/middleware/reserveCredit.js (NEW)
import asyncHandler from '../utils/asyncHandler.js';
import { creditStore } from '../utils/credits.js';

// Replaces creditCheck on paid generation routes. Atomically reserves
// `required` credits BEFORE the handler runs; the handler refunds on failure
// (see generatorController). 402 when the balance is short, same as before.
// Sets req.creditReserved so the handler knows a refund is owed on failure,
// and refreshes req.user.credits so downstream code sees the new balance.
const reserveCredit = (required = 1) =>
  asyncHandler(async (req, res, next) => {
    const user = await creditStore.reserve(req.user._id, required);
    if (!user) return res.status(402).json({ message: 'Insufficient credits' });
    req.creditReserved = required;
    req.user.credits = user.credits;
    next();
  });

export default reserveCredit;
