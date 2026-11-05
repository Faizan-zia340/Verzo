import { Router } from 'express';
import { register, login, getMe, logout, forgotPassword, resetPassword } from '../controllers/authController.js';
import protect from '../middleware/auth.js';
import { validate, registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../utils/validators.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password/:token', validate(resetPasswordSchema), resetPassword);
router.get('/me', protect, getMe);
router.post('/logout', logout);

export default router;
