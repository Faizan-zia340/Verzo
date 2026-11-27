import cron from 'node-cron';
import mongoose from 'mongoose';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import { FREE_SIGNUP_CREDITS } from '../config/pricing.js';
import { createCreditResetter } from '../utils/creditReset.js';

const FREE_DAILY_CREDITS = Number(process.env.FREE_DAILY_CREDITS || FREE_SIGNUP_CREDITS);

const { resetDailyFreeCredits: resetTopUp } = createCreditResetter(User, FREE_DAILY_CREDITS);

export const resetDailyFreeCredits = async () => {
  const modifiedCount = await resetTopUp();
  if (modifiedCount) {
    logger.info({ usersReset: modifiedCount, credits: FREE_DAILY_CREDITS }, 'Daily free credits reset');
  }
  return modifiedCount;
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
