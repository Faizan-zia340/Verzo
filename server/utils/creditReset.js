// server/utils/creditReset.js
// Top-up-only daily free-credit reset.
//
// The old reset did `$set: { credits: FREE_DAILY_CREDITS }` for every
// `free` user, which WIPED purchased credits: a user who bought 120 credits
// woke up with 20 after the next reset (and after every server restart,
// since the job also runs on boot). This version only tops up — a user is
// reset to the free allowance ONLY when they currently hold less than it,
// and is never reduced.
//
// Two guards that must stay together:
//   * `credits: { $lt: freeDailyCredits }` — never reduce a balance.
//   * `isEmailVerified: { $ne: false }` — unverified accounts never get the
//     free daily top-up, or registration without verifying would still earn
//     20 credits a day. (Accounts created before verification existed have
//     no such field, and `$ne: false` matches a missing field, so they are
//     unaffected.)
//
// Built through a factory so tests can pass a fake model
// (createCreditResetter(fakeUser).resetDailyFreeCredits()) — see
// server/tests/creditReset.test.js. The job file
// (server/jobs/dailyCreditReset.js) wires it with the real User model.
import { FREE_SIGNUP_CREDITS } from '../config/pricing.js';

export const createCreditResetter = (UserModel, freeDailyCredits = FREE_SIGNUP_CREDITS) => ({
  resetDailyFreeCredits: async () => {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setUTCHours(0, 0, 0, 0);

    const result = await UserModel.updateMany(
      {
        subscription: 'free',
        credits: { $lt: freeDailyCredits },
        isEmailVerified: { $ne: false },
        $or: [
          { lastFreeCreditResetAt: { $exists: false } },
          { lastFreeCreditResetAt: { $lt: startOfToday } },
        ],
      },
      {
        $set: {
          credits: freeDailyCredits,
          lastFreeCreditResetAt: now,
        },
      }
    );

    return result.modifiedCount;
  },
});
