import { generateContent, generateRAGContent } from '../utils/openai.js';
import Content from '../models/Content.js';
import Credit from '../models/Credit.js';
import User from '../models/User.js';
import Context from '../models/Context.js';
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

export const generateAIContent = async (req, res, next) => {
  try {
    const { userPrompt, topicKeywords = [] } = req.body;

    if (!userPrompt) {
      return res.status(400).json({ message: 'userPrompt is required' });
    }

    const foundContext = topicKeywords.length
      ? await Context.findOne({ keywords: { $in: topicKeywords } })
      : null;

    let finalPrompt;
    if (foundContext) {
      finalPrompt =
        `Context Information: ${foundContext.information}\n\n` +
        `Strict Instructions: You must use the above Context Information to answer the following prompt. Do not make up any false facts.\n\n` +
        `User Prompt: ${userPrompt}`;
    } else {
      finalPrompt = userPrompt;
    }

    const result = await generateRAGContent(finalPrompt);

    res.json({
      response: result,
      contextUsed: foundContext !== null,
      contextTitle: foundContext ? foundContext.title : null,
    });
  } catch (err) {
    next(err);
  }
};
