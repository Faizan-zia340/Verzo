import { Router } from 'express';
import { generate, streamGenerate, tuneContent, generateAIContent } from '../controllers/generatorController.js';
import protect from '../middleware/auth.js';
import creditCheck from '../middleware/creditCheck.js';
import { validate, generateSchema } from '../utils/validators.js';

const router = Router();

router.post('/', protect, creditCheck(1), validate(generateSchema), generate);
router.post('/stream', protect, creditCheck(1), validate(generateSchema), streamGenerate);
router.post('/tune', protect, tuneContent);
router.post('/rag', generateAIContent);

export default router;
