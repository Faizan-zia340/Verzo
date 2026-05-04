import { Router } from 'express';
import { generate, streamGenerate, tuneContent, generateAIContent } from '../controllers/generatorController.js';
import protect from '../middleware/auth.js';
import creditCheck from '../middleware/creditCheck.js';
import { validate, generateSchema } from '../utils/validators.js';
import openai from '../config/openai.js';

const router = Router();

router.post('/', protect, creditCheck(1), validate(generateSchema), generate);
router.post('/stream', protect, creditCheck(1), validate(generateSchema), streamGenerate);
router.post('/tune', protect, tuneContent);
router.post('/rag', generateAIContent);

// Diagnostic: test OpenAI key without consuming user credits
router.get('/ping-openai', protect, async (req, res) => {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ ok: false, error: 'OPENAI_API_KEY not set on server' });
  }
  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Say "ok" in one word.' }],
      max_tokens: 5,
    });
    const text = response.data.choices[0].message.content.trim();
    console.log('[OpenAI Ping] SUCCESS:', text);
    return res.json({ ok: true, response: text });
  } catch (err) {
    const status = err.response?.status;
    const detail = err.response?.data?.error?.message || err.message || 'Unknown error';
    console.error(`[OpenAI Ping] FAILED status=${status} detail="${detail}"`);
    return res.status(status || 500).json({ ok: false, status, error: detail });
  }
});

export default router;
