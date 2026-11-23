import { Router } from 'express';
import multer from 'multer';
import protect from '../middleware/auth.js';
import userRateLimit from '../middleware/userRateLimit.js';
import { analyzePDF } from '../controllers/pdfController.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  },
});

router.post('/analyze', protect, userRateLimit(10), upload.single('pdf'), analyzePDF);

export default router;
