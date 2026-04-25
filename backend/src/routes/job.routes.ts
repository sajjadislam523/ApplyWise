import { Router } from 'express';
import {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  getAnalytics,
} from '../controllers/job.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// All job routes require authentication
router.use(protect);

// Analytics must come before /:id — otherwise Express matches "analytics" as an id
router.get('/analytics', getAnalytics);

router.route('/')
  .post(createJob)
  .get(getJobs);

router.route('/:id')
  .get(getJobById)
  .put(updateJob)
  .delete(deleteJob);

export default router;
