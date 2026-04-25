import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Job, { IJob } from '../models/Job.model';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { asyncHandler } from '../middleware/error.middleware';

// ─── POST /api/jobs ────────────────────────────────────────────────────────
export const createJob = asyncHandler(async (req: Request, res: Response) => {
  const job = await Job.create({ ...req.body, user: req.user!.id });
  return sendSuccess(res, job, 'Job application created', 201);
});

// ─── GET /api/jobs ─────────────────────────────────────────────────────────
export const getJobs = asyncHandler(async (req: Request, res: Response) => {
  const {
    status,
    tags,
    startDate,
    endDate,
    search,
    sortBy = 'applicationDate',
    order = 'desc',
    page = '1',
    limit = '20',
  } = req.query as Record<string, string>;

  // Always scope to the authenticated user
  const query: Record<string, unknown> = { user: req.user!.id };

  if (status) query.status = status;
  if (tags)   query.tags = { $in: tags.split(',').map((t: string) => t.trim()) };

  if (startDate || endDate) {
    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate)   dateFilter.$lte = new Date(endDate);
    query.applicationDate = dateFilter;
  }

  if (search) {
    query.$or = [
      { title:   { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
    ];
  }

  const sortOrder = order === 'asc' ? 1 : -1;
  const allowedSortFields = ['applicationDate', 'company', 'title', 'createdAt', 'lastActivityAt'];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'applicationDate';

  const pageNum  = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip     = (pageNum - 1) * limitNum;

  const [jobs, total] = await Promise.all([
    Job.find(query)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limitNum)
      .select('-description'),
    Job.countDocuments(query),
  ]);

  return sendSuccess(res, jobs, 'Jobs fetched', 200, {
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
  });
});

// ─── GET /api/jobs/:id ─────────────────────────────────────────────────────
export const getJobById = asyncHandler(async (req: Request, res: Response) => {
  const job = await Job.findOne({ _id: req.params.id, user: req.user!.id });
  if (!job) return sendError(res, 'Job not found', 404);
  return sendSuccess(res, job);
});

// ─── PUT /api/jobs/:id ─────────────────────────────────────────────────────
export const updateJob = asyncHandler(async (req: Request, res: Response) => {
  const { user: _u, ...updateData } = req.body;

  const job = await Job.findOneAndUpdate(
    { _id: req.params.id, user: req.user!.id },
    { ...updateData },
    { new: true, runValidators: true }
  );

  if (!job) return sendError(res, 'Job not found', 404);
  return sendSuccess(res, job, 'Job updated');
});

// ─── DELETE /api/jobs/:id ──────────────────────────────────────────────────
export const deleteJob = asyncHandler(async (req: Request, res: Response) => {
  const job = await Job.findOneAndDelete({ _id: req.params.id, user: req.user!.id });
  if (!job) return sendError(res, 'Job not found', 404);
  return sendSuccess(res, null, 'Job deleted');
});

// ─── GET /api/jobs/analytics ───────────────────────────────────────────────
export const getAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const userId = new mongoose.Types.ObjectId(req.user!.id);
  const now    = new Date();
  const twelveWeeksAgo  = new Date(now.getTime() - 12 * 7  * 24 * 60 * 60 * 1000);
  const twelveMonthsAgo = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000);

  const [statusStats, weeklyStats, monthlyStats, tagStats, avgResponseTime] = await Promise.all([
    // Status distribution — all time
    Job.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),

    // Applications per ISO week — last 12 weeks
    Job.aggregate([
      { $match: { user: userId, applicationDate: { $gte: twelveWeeksAgo } } },
      {
        $group: {
          _id: {
            year:  { $isoWeekYear: '$applicationDate' },
            week:  { $isoWeek: '$applicationDate' },
          },
          count: { $sum: 1 },
          // Carry first date of each week for clean frontend label
          firstDate: { $min: '$applicationDate' },
        },
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } },
    ]),

    // Applications per calendar month — last 12 months
    Job.aggregate([
      { $match: { user: userId, applicationDate: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            year:  { $year: '$applicationDate' },
            month: { $month: '$applicationDate' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),

    // Top 10 tags
    Job.aggregate([
      { $match: { user: userId } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),

    // Average days from applicationDate to first status change
    // Approximated as: avg(updatedAt - applicationDate) for non-applied jobs
    Job.aggregate([
      { $match: { user: userId, status: { $ne: 'applied' } } },
      {
        $project: {
          daysToResponse: {
            $divide: [
              { $subtract: ['$updatedAt', '$applicationDate'] },
              1000 * 60 * 60 * 24, // ms → days
            ],
          },
        },
      },
      { $group: { _id: null, avg: { $avg: '$daysToResponse' } } },
    ]),
  ]);

  const byStatus = statusStats.reduce<Record<string, number>>((acc, { _id, count }) => {
    acc[_id] = count;
    return acc;
  }, {});

  const total         = Object.values(byStatus).reduce((a, b) => a + b, 0);
  const responded     = (byStatus.interviewing || 0) + (byStatus.offer || 0) + (byStatus.rejected || 0);
  const responseRate  = total ? (responded / total * 100) : 0;
  const interviewRate = total ? ((byStatus.interviewing || 0) / total * 100) : 0;
  const offerRate     = total ? ((byStatus.offer || 0) / total * 100) : 0;
  const staleRate     = total ? ((byStatus.stale || 0) / total * 100) : 0;

  const avgDays = avgResponseTime[0]?.avg ?? null;

  return sendSuccess(res, {
    total,
    byStatus,
    rates: {
      response:  Math.round(responseRate  * 10) / 10,
      interview: Math.round(interviewRate * 10) / 10,
      offer:     Math.round(offerRate     * 10) / 10,
      stale:     Math.round(staleRate     * 10) / 10,
    },
    avgDaysToResponse: avgDays !== null ? Math.round(avgDays * 10) / 10 : null,
    weekly:  weeklyStats,
    monthly: monthlyStats,
    topTags: tagStats,
  });
});
