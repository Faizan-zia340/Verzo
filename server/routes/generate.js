import { Router } from 'express';
import multer from 'multer';
import { streamGenerate, tuneContent, generateAIContent, generateFromImage } from '../controllers/generatorController.js';
import protect from '../middleware/auth.js';
import reserveCredit from '../middleware/reserveCredit.js';
import uploadLimit from '../middleware/uploadLimit.js';
import userRateLimit from '../middleware/userRateLimit.js';
import { validate, generateSchema, tuneSchema, ragSchema } from '../utils/validators.js';
import { MAX_IMAGE_BYTES, ALLOWED_IMAGE_MIMES } from '../utils/imageInput.js';

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

router.post('/stream', protect, genLimit, validate(generateSchema), reserveCredit(1), streamGenerate);
router.post('/with-image', protect, genLimit, imageUpload.single('image'), handleUploadError, uploadLimit('image'), reserveCredit(1), generateFromImage);
router.post('/tune', protect, genLimit, validate(tuneSchema), reserveCredit(1), tuneContent);
router.post('/rag', protect, genLimit, validate(ragSchema), reserveCredit(1), generateAIContent);

export default router;

