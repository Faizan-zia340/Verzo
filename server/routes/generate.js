import { Router } from 'express';
import { generate, streamGenerate, tuneContent, generateAIContent } from '../controllers/generatorController.js';
import protect from '../middleware/auth.js';
import creditCheck from '../middleware/creditCheck.js';
import { validate, generateSchema } from '../utils/validators.js';
import getClient, { MODEL, API_VERSION } from '../config/gemini.js';

const router = Router();

router.post('/', protect, creditCheck(1), validate(generateSchema), generate);
router.post('/stream', protect, creditCheck(1), validate(generateSchema), streamGenerate);
router.post('/tune', protect, tuneContent);
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
    console.log('[Gemini Ping] SUCCESS:', text);
    return res.json({ ok: true, model: MODEL, response: text });
  } catch (err) {
    const msg = err.message || 'Unknown error';
    console.error('[Gemini Ping] FAILED:', msg.slice(0, 200));
    return res.status(500).json({ ok: false, error: msg });
  }
});

export default router;
