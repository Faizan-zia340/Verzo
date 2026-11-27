import { Router } from 'express';
import multer from 'multer';
import protect from '../middleware/auth.js';
import reserveCredit from '../middleware/reserveCredit.js';
import uploadLimit from '../middleware/uploadLimit.js';
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

// 1 credit per analysis (reserveCredit). It runs AFTER the upload so a
// rejected file (wrong type, too large) never reserves a credit, and
// AFTER uploadLimit so an over-limit upload never reserves one either;
// the handler refunds on every failure exit (no file, unreadable PDF, AI
// failure) and keeps the credit only on a successful analysis.
router.post('/analyze', protect, userRateLimit(10), upload.single('pdf'), uploadLimit('pdf'), reserveCredit(1), analyzePDF);

export default router;
