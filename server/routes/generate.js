import { Router } from 'express';
import multer from 'multer';
import { generate, streamGenerate, tuneContent, generateAIContent, generateFromImage } from '../controllers/generatorController.js';
import protect from '../middleware/auth.js';
import reserveCredit from '../middleware/reserveCredit.js';
import creditCheck from '../middleware/creditCheck.js';
import userRateLimit from '../middleware/userRateLimit.js';
import { validate, generateSchema } from '../utils/validators.js';
import { MAX_IMAGE_BYTES, ALLOWED_IMAGE_MIMES } from '../utils/imageInput.js';
import getClient, { MODEL, API_VERSION } from '../config/gemini.js';
import logger from '../utils/logger.js';
import asyncHandler from '../utils/asyncHandler.js';
import { mapProviderError, penlixUnavailableMessage } from '../utils/quotaMessages.js';

const router = Router();

const genLimit = userRateLimit(10);

// Single image upload for /with-image: memory only (never written to disk),
// 5 MB max, JPG/PNG/WebP only. The bytes are used for one Gemini call and
// then discarded — nothing is stored in MongoDB.
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_MIMES.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Unsupported image type. Use JPG, PNG or WebP.'));
  },
});

// Multer errors (too large, wrong type) become a clean 400, not a 500.
const handleUploadError = (err, _req, res, next) => {
  if (!err) return next();
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'Image is too large. Maximum is 5 MB.' });
  }
  if (err.code && String(err.code).startsWith('LIMIT_')) {
    return res.status(400).json({ message: 'Invalid upload. Attach one image (JPG, PNG or WebP, max 5 MB).' });
  }
  if (err.message && /unsupported image type/i.test(err.message)) {
    return res.status(400).json({ message: err.message });
  }
  return next(err);
};

router.post('/', protect, genLimit, validate(generateSchema), reserveCredit(1), generate);
router.post('/stream', protect, genLimit, validate(generateSchema), reserveCredit(1), streamGenerate);
router.post('/with-image', protect, genLimit, imageUpload.single('image'), handleUploadError, reserveCredit(1), generateFromImage);
router.post('/tune', protect, genLimit, tuneContent);
router.post('/rag', protect, genLimit, creditCheck(1), generateAIContent);

// Diagnostic: verify the AI key works without consuming user credits
router.get('/ping-ai', protect, asyncHandler(async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ ok: false, error: penlixUnavailableMessage() });
  }
  try {
    const genAI = getClient();
    const model = genAI.getGenerativeModel({ model: MODEL }, { apiVersion: API_VERSION });
    const result = await model.generateContent('Say "ok" in one word only.');
    const text = result.response.text().trim();
    logger.info({ text }, 'AI ping success');
    return res.status(200).json({ ok: true, model: MODEL, response: text });
  } catch (err) {
    const msg = err.message || 'Unknown error';
    logger.error({ msg: msg.slice(0, 200) }, 'AI ping failed');
    const mapped = mapProviderError(err);
    return res.status(mapped.status).json({ ok: false, error: mapped.message });
  }
}));

export default router;

