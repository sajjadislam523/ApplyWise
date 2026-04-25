import cron from 'node-cron';
import dayjs from 'dayjs';
import mongoose from 'mongoose';
import Job from '../models/Job.model';
import User from '../models/User.model';
import { sendStaleDigest, StaleJobSummary } from '../utils/email';

export const startStaleChecker = (): void => {
  cron.schedule('0 0 * * *', async () => {
    console.log(`[StaleChecker] Running at ${new Date().toISOString()}`);
    await runStaleCheckManually();
  });
  console.log('[StaleChecker] Scheduled — runs daily at midnight');
};

export const runStaleCheckManually = async (): Promise<{ marked: number; checked: number }> => {
  try {
    const candidates = await Job.find({
      status:  { $in: ['applied', 'interviewing'] },
      isStale: false,
    })
      .select('_id title company user lastActivityAt timeoutDays')
      .lean();

    if (candidates.length === 0) return { marked: 0, checked: 0 };

    const now      = dayjs();
    const staleIds: mongoose.Types.ObjectId[]          = [];
    const staleByUser: Record<string, StaleJobSummary[]> = {};

    for (const job of candidates) {
      const daysSinceActivity = now.diff(dayjs(job.lastActivityAt), 'day');
      if (daysSinceActivity >= job.timeoutDays) {
        staleIds.push(job._id as mongoose.Types.ObjectId);
        const uid = String(job.user);
        if (!staleByUser[uid]) staleByUser[uid] = [];
        staleByUser[uid].push({ title: job.title, company: job.company, days: daysSinceActivity });
      }
    }

    if (staleIds.length > 0) {
      await Job.updateMany(
        { _id: { $in: staleIds } },
        { $set: { status: 'stale', isStale: true } }
      );
      console.log(`[StaleChecker] Marked ${staleIds.length}/${candidates.length} stale`);

      // Fire digest email per affected user — never awaited so it never blocks
      for (const [userId, jobs] of Object.entries(staleByUser)) {
        User.findById(userId)
          .select('name email')
          .then((user) => {
            if (!user) return;
            sendStaleDigest(user.email, user.name, jobs).catch((err) =>
              console.error(`[StaleChecker] Email failed for ${user.email}:`, err)
            );
          })
          .catch((err) => console.error('[StaleChecker] User lookup failed:', err));
      }
    }

    return { marked: staleIds.length, checked: candidates.length };
  } catch (error) {
    console.error('[StaleChecker] Error:', error);
    return { marked: 0, checked: 0 };
  }
};
