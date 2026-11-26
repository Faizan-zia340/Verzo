import { Router } from 'express';
import { generate, streamGenerate, tuneContent, generateAIContent } from '../controllers/generatorController.js';
import protect from '../middleware/auth.js';
import reserveCredit from '../middleware/reserveCredit.js';
import userRateLimit from '../middleware/userRateLimit.js';
import { validate, generateSchema } from '../utils/validators.js';
import getClient, { MODEL, API_VERSION } from '../config/gemini.js';
import logger from '../utils/logger.js';
import asyncHandler from '../utils/asyncHandler.js';
import { mapProviderError, penlixUnavailableMessage } from '../utils/quotaMessages.js';

const router = Router();

const genLimit = userRateLimit(10);

router.post('/', protect, genLimit, validate(generateSchema), reserveCredit(1), generate);
router.post('/stream', protect, genLimit, validate(generateSchema), reserveCredit(1), streamGenerate);
router.post('/tune', protect, genLimit, tuneContent);
<<<<<<< HEAD
router.post('/rag', protect, genLimit, creditCheck(1), generateAIContent);
=======
// Per-user limit needs an authenticated user: protect comes first so the
// limit is enforced per user, not skipped. (Credit handling for /rag is
// added by the security-critical-fixes PR; this PR only adds the limit.)
router.post('/rag', protect, genLimit, generateAIContent);
>>>>>>> 043f117 (Per-user quota limits with Verzo-branded messages)

// Diagnostic: verify the AI key works without consuming user credits
router.get('/ping-ai', protect, asyncHandler(async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ ok: false, error: penlixUnavailableMessage() });
  }
  try {
    const genAI = getClient();
    const model = genAI.getGenerativeModel({ model: MODEL }, { apiVersion: API_VERSION });
    const result = await model.generateContent('Say "ok" in one word only.');
    const text = result.response.text().trim();
    logger.info({ text }, 'AI ping success');
    return res.status(200).json({ ok: true, model: MODEL, response: text });
  } catch (err) {
    const msg = err.message || 'Unknown error';
    logger.error({ msg: msg.slice(0, 200) }, 'AI ping failed');
    const mapped = mapProviderError(err);
    return res.status(mapped.status).json({ ok: false, error: mapped.message });
  }
}));

export default router;

