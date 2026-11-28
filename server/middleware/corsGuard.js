// Reject non-allowlisted browser origins with a clean 403, not a 500.
// The `cors` middleware turns a callback Error into a 500 via the error
// handler; this guard runs first, so a disallowed Origin never reaches it.
// Requests without an Origin header (curl, server-to-server) pass through.
import { isAllowedOrigin } from '../utils/corsOrigins.js';

export const corsGuard = (req, res, next) => {
  if (isAllowedOrigin(req.headers.origin)) return next();
  return res.status(403).json({ message: 'Penlix does not allow requests from this origin.' });
};

export default corsGuard;
