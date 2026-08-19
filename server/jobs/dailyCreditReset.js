import cron from 'node-cron';
import mongoose from 'mongoose';
import User from '../models/User.js';
import logger from '../utils/logger.js';

const FREE_DAILY_CREDITS = Number(process.env.FREE_DAILY_CREDITS || 10);

export const resetDailyFreeCredits = async () => {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setUTCHours(0, 0, 0, 0);

  const result = await User.updateMany(
    {
      subscription: 'free',
      $or: [
        { lastFreeCreditResetAt: { $exists: false } },
        { lastFreeCreditResetAt: { $lt: startOfToday } },
      ],
    },
    {
      $set: {
        credits: FREE_DAILY_CREDITS,
        lastFreeCreditResetAt: now,
      },
    }
  );

  if (result.modifiedCount) {
    logger.info({ usersReset: result.modifiedCount, credits: FREE_DAILY_CREDITS }, 'Daily free credits reset');
  }
  return result.modifiedCount;
};

export const scheduleDailyFreeCreditReset = () => {
  const runReset = () => {
    resetDailyFreeCredits().catch((err) => {
      logger.error({ err }, 'Daily free credit reset failed');
    });
  };

  cron.schedule('0 0 * * *', runReset, { timezone: 'UTC' });

  if (mongoose.connection.readyState === 1) runReset();
  else mongoose.connection.once('connected', runReset);
};