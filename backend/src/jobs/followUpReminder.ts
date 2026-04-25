import cron from 'node-cron';
import dayjs from 'dayjs';
import Job from '../models/Job.model';
import User from '../models/User.model';
import { sendFollowUpReminder } from '../utils/email';

export const startFollowUpReminder = (): void => {
  // Runs at 9am every day
  cron.schedule('0 9 * * *', async () => {
    console.log(`[FollowUpReminder] Running at ${new Date().toISOString()}`);

    try {
      const sevenDaysAgo = dayjs().subtract(7, 'day').toDate();

      // Find applied jobs that:
      //   - are still in 'applied' status
      //   - have NOT had a follow-up sent
      //   - were applied to at least 7 days ago
      //   - are not stale
      const jobs = await Job.find({
        status:       'applied',
        followUpSent: false,
        isStale:      false,
        applicationDate: { $lte: sevenDaysAgo },
      })
        .select('_id title company user applicationDate')
        .lean();

      if (jobs.length === 0) return;

      // Deduplicate to one email per user containing all their reminder jobs
      const jobsByUser: Record<string, typeof jobs> = {};
      for (const job of jobs) {
        const uid = String(job.user);
        if (!jobsByUser[uid]) jobsByUser[uid] = [];
        jobsByUser[uid].push(job);
      }

      for (const [userId, userJobs] of Object.entries(jobsByUser)) {
        User.findById(userId)
          .select('name email')
          .then((user) => {
            if (!user) return;
            // Send one reminder per job — could be batched but individual emails
            // feel more actionable than a digest for follow-ups
            for (const job of userJobs) {
              sendFollowUpReminder(
                user.email,
                user.name,
                job.title,
                job.company,
                String(job._id)
              ).catch((err) =>
                console.error(`[FollowUpReminder] Email failed for ${user.email}:`, err)
              );
            }
          })
          .catch((err) => console.error('[FollowUpReminder] User lookup failed:', err));
      }

      console.log(`[FollowUpReminder] Sent reminders for ${jobs.length} jobs`);
    } catch (error) {
      console.error('[FollowUpReminder] Error:', error);
    }
  });

  console.log('[FollowUpReminder] Scheduled — runs daily at 9am');
};
