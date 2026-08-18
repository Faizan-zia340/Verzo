import { Router } from 'express';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const all = await db.select().from(users);
  res.status(200).json(all);
}));

router.post('/', asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  const [user] = await db.insert(users).values({ name, email }).returning();
  res.status(201).json(user);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await db.delete(users).where(eq(users.id, Number(req.params.id)));
  res.status(200).json({ success: true });
}));

export default router;
