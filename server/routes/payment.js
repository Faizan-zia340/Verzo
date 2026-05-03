import { Router } from 'express';
import { createPaymentIntent, webhook, getPaymentHistory } from '../controllers/paymentController.js';
import protect from '../middleware/auth.js';

const router = Router();

router.post('/create-intent', protect, createPaymentIntent);
router.post('/webhook', webhook);
router.get('/history', protect, getPaymentHistory);

export default router;
