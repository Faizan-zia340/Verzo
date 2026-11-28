// server/jobs/dailyBackup.js
// Daily database backup: dumps all 7 collections to JSON and uploads
// them to Cloudinary as private raw files. Same in-process node-cron
// pattern as dailyCreditReset.js. Never throws — a failed run is only
// logged, the server keeps running.
import cron from 'node-cron';
import logger from '../utils/logger.js';
import { createDbBackup } from '../utils/dbBackup.js';
import { getCloudinary, isConfigured } from '../utils/mediaStorage.js';
import User from '../models/User.js';
import Content from '../models/Content.js';
import Credit from '../models/Credit.js';
import Context from '../models/Context.js';
import Feedback from '../models/Feedback.js';
import Suggestion from '../models/Suggestion.js';
import Payment from '../models/Payment.js';

const COLLECTIONS = [
  { name: 'users', model: User },
  { name: 'contents', model: Content },
  { name: 'credits', model: Credit },
  { name: 'contexts', model: Context },
  { name: 'feedbacks', model: Feedback },
  { name: 'suggestions', model: Suggestion },
  { name: 'payments', model: Payment },
];

export const runDailyBackup = async () => {
  if (!isConfigured()) {
    logger.warn('Daily backup skipped — Cloudinary is not configured');
    return [];
  }
  const { runBackup } = createDbBackup(COLLECTIONS, { cloudinary: await getCloudinary() });
  return runBackup();
};

export const scheduleDailyBackup = () => {
  // 22:00 UTC = 03:00 PKT — low-traffic hour for a small daily dump.
  cron.schedule('0 22 * * *', () => {
    runDailyBackup().catch((err) => {
      logger.error({ err: err.message }, 'Daily backup failed');
    });
  }, { timezone: 'UTC' });
};
