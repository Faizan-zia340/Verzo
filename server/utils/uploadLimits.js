// server/utils/uploadLimits.js
// Daily per-user upload-count limits.
//
// The file-size caps (5 MB images, 10 MB PDFs) bound how BIG one upload can
// be; these limits bound how MANY uploads a user can make per day. They sit
// on top of the 1-credit-per-generation cost, and they apply to uploads
// whether or not a generation follows (media storage is not generation).
//
// What counts:
//   * "image" — an image sent with a generation (/api/generate/with-image)
//     and any file stored through /api/media/upload (images and audio share
//     this bucket; the media route is one storage endpoint).
//   * "pdf" — a PDF sent to /api/pdf/analyze.
//
// Rules the middleware enforces (see server/middleware/uploadLimit.js):
//   * A file rejected by validation (wrong type, too large) never counts —
//     the middleware runs AFTER multer and skips when there is no file.
//   * An over-limit upload never reserves a credit — the middleware runs
//     BEFORE reserveCredit.
//   * A file that passes validation counts even if the generation behind
//     it later fails, because the file was received and processed.
//
// Limits (per UTC day):
//   free:  10 images, 5 PDFs
//   basic: 50 images, 20 PDFs
//   pro:   50 images, 20 PDFs
//
// Built through a factory so tests can pass a fake model
// (createUploadLimiter(fakeUser)) — see server/tests/uploadLimits.test.js.
// The middleware (server/middleware/uploadLimit.js) wires it with the real
// User model.

export const UPLOAD_LIMITS = {
  free: { images: 10, pdfs: 5 },
  basic: { images: 50, pdfs: 20 },
  pro: { images: 50, pdfs: 20 },
};

export const limitFor = (subscription) => UPLOAD_LIMITS[subscription] || UPLOAD_LIMITS.free;

// 'YYYY-MM-DD' in UTC — the day key stored on the user document.
export const todayKey = (d = new Date()) => d.toISOString().slice(0, 10);

// Seconds until the next UTC midnight, for the client's Retry-After.
export const secondsUntilMidnightUTC = (now = new Date()) => {
  const midnight = new Date(now);
  midnight.setUTCHours(24, 0, 0, 0);
  return Math.max(1, Math.ceil((midnight - now) / 1000));
};

const fieldFor = (kind) => (kind === 'pdf' ? 'pdfs' : 'images');

// User-facing 429 message. Never mentions the AI provider — brand name
// only (same rule as server/utils/quotaMessages.js).
export const uploadLimitMessage = (subscription, kind, limit) => {
  const noun = kind === 'pdf' ? 'PDF' : 'image';
  if (subscription === 'free') {
    return `You've reached today's upload limit — ${limit} ${noun} uploads per day for free accounts. Upgrade to upload more, or try again tomorrow.`;
  }
  return `You've reached today's upload limit — ${limit} ${noun} uploads per day. Try again tomorrow.`;
};

export const createUploadLimiter = (UserModel) => ({
  // Atomically counts one upload of `kind` ('image' | 'pdf') for today.
  // Returns { allowed, limit, used }. Two updates: first roll the stored
  // day over to today (a no-op when already today, and it also repairs
  // accounts that never had a counter), then a capped $inc — the $lt
  // guard in the filter makes the increment itself atomic, so two
  // concurrent requests cannot both pass the cap.
  checkAndCount: async (userId, subscription, kind, today = todayKey()) => {
    const field = fieldFor(kind);
    const limit = limitFor(subscription)[field];

    await UserModel.updateOne(
      { _id: userId, 'uploadCounts.day': { $ne: today } },
      { $set: { 'uploadCounts.day': today, 'uploadCounts.images': 0, 'uploadCounts.pdfs': 0 } }
    );

    const updated = await UserModel.findOneAndUpdate(
      { _id: userId, 'uploadCounts.day': today, [`uploadCounts.${field}`]: { $lt: limit } },
      { $inc: { [`uploadCounts.${field}`]: 1 } },
      { new: true }
    );

    if (!updated) return { allowed: false, limit, used: limit };
    return { allowed: true, limit, used: updated.uploadCounts[field] };
  },
});
