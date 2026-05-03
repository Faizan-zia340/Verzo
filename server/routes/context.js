import { Router } from 'express';
import Context from '../models/Context.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const { title, keywords, information } = req.body;
    const context = await Context.create({ title, keywords, information });
    res.status(201).json({ message: 'Context saved successfully', context });
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const contexts = await Context.find().sort({ createdAt: -1 });
    res.json(contexts);
  } catch (err) {
    next(err);
  }
});

export default router;
