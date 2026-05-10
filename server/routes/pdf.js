import { Router } from 'express';
import multer from 'multer';
import protect from '../middleware/auth.js';
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

router.post('/analyze', protect, upload.single('pdf'), analyzePDF);

export default router;
