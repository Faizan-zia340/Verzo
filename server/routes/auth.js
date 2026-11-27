import { Router } from 'express';
import { register, login, getMe, logout, forgotPassword, resetPassword, verifyEmail, resendVerificationEmail, verifyTwoFactor, toggleTwoFactor } from '../controllers/authController.js';
import protect from '../middleware/auth.js';
import { validate, registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, twoFactorVerifySchema, twoFactorToggleSchema } from '../utils/validators.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/2fa/verify', validate(twoFactorVerifySchema), verifyTwoFactor);
router.post('/2fa/toggle', protect, validate(twoFactorToggleSchema), toggleTwoFactor);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password/:token', validate(resetPasswordSchema), resetPassword);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', protect, resendVerificationEmail);
router.get('/me', protect, getMe);
router.post('/logout', logout);

export default router;
