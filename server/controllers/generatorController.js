import { generateContent } from '../utils/openai.js';
import Content from '../models/Content.js';
import Credit from '../models/Credit.js';
import User from '../models/User.js';
import { io } from '../server.js';

export const generate = async (req, res, next) => {
  try {
    const { type, prompt, tone, length } = req.body;
    const userId = req.user._id;

    io.to(userId.toString()).emit('generation:start');

    const output = await generateContent({ type, prompt, tone, length });

    const [content] = await Promise.all([
      Content.create({ user: userId, type, prompt, output, creditsUsed: 1 }),
      User.findByIdAndUpdate(userId, { $inc: { credits: -1 } }),
      Credit.create({ user: userId, amount: -1, type: 'usage', description: `Generated ${type} content` }),
    ]);

    io.to(userId.toString()).emit('generation:done', { content });

    res.json({ content });
  } catch (err) {
    next(err);
  }
};
