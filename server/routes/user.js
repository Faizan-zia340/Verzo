import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/userController.js';
import { exportUserData } from '../controllers/dataExportController.js';
import protect from '../middleware/auth.js';
import userRateLimit from '../middleware/userRateLimit.js';

const router = Router();

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
// Download your own data (profile, generations, uploads, feedback,
// glossary suggestions) as JSON. 5 downloads/hour per user.
router.get('/data-export', protect, userRateLimit(5, 'Data export'), exportUserData);

export default router;
