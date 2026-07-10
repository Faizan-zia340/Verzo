import { Router } from 'express';
import { generate, streamGenerate, tuneContent, generateAIContent } from '../controllers/generatorController.js';
import protect from '../middleware/auth.js';
import creditCheck from '../middleware/creditCheck.js';
import userRateLimit from '../middleware/userRateLimit.js';
import { validate, generateSchema } from '../utils/validators.js';
import getClient, { MODEL, API_VERSION } from '../config/gemini.js';
import logger from '../utils/logger.js';

const router = Router();

const genLimit = userRateLimit(10);

router.post('/', protect, genLimit, creditCheck(1), validate(generateSchema), generate);
router.post('/stream', protect, genLimit, creditCheck(1), validate(generateSchema), streamGenerate);
router.post('/tune', protect, genLimit, tuneContent);
router.post('/rag', generateAIContent);

// Diagnostic: verify Gemini key works without consuming user credits
router.get('/ping-ai', protect, async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ ok: false, error: 'GEMINI_API_KEY not set on server' });
  }
  try {
    const genAI = getClient();
    const model = genAI.getGenerativeModel({ model: MODEL }, { apiVersion: API_VERSION });
    const result = await model.generateContent('Say "ok" in one word only.');
    const text = result.response.text().trim();
    logger.info({ text }, 'Gemini ping success');
    return res.json({ ok: true, model: MODEL, response: text });
  } catch (err) {
    const msg = err.message || 'Unknown error';
    logger.error({ msg: msg.slice(0, 200) }, 'Gemini ping failed');
    return res.status(500).json({ ok: false, error: msg });
  }
});

export default router;
