import { Router } from 'express';
import { updateProfile, changePassword } from '../controllers/userController.js';
import { exportUserData } from '../controllers/dataExportController.js';
import protect from '../middleware/auth.js';
import userRateLimit from '../middleware/userRateLimit.js';
import { validate, changePasswordSchema } from '../utils/validators.js';

const router = Router();

router.put('/profile', protect, updateProfile);
// Change password while signed in — 5 attempts/hour per user, same
// validation rule as registration/reset.
router.post('/change-password', protect, userRateLimit(5, 'Password change'), validate(changePasswordSchema), changePassword);
// Download your own data (profile, generations, uploads, feedback,
// glossary suggestions) as JSON. 5 downloads/hour per user.
router.get('/data-export', protect, userRateLimit(5, 'Data export'), exportUserData);

export default router;
