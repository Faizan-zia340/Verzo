import { Router } from 'express';
import { register, login, getMe, logout } from '../controllers/authController.js';
import protect from '../middleware/auth.js';
import { validate, registerSchema, loginSchema } from '../utils/validators.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', protect, getMe);
router.post('/logout', logout);

export default router;
