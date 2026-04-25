// types/job.ts
export type JobStatus = 'applied' | 'interviewing' | 'offer' | 'rejected' | 'stale';
export type LocationType = 'remote' | 'onsite' | 'hybrid';

export interface Job {
  _id: string;
  user: string;
  title: string;
  company: string;
  location?: LocationType;
  salary?: string;
  applicationDate: string;
  status: JobStatus;
  noticePeriod?: string;
  description?: string;
  jobLink?: string;
  tags: string[];
  followUpSent: boolean;
  followUpDate?: string;
  timeoutDays: number;
  isStale: boolean;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateJobInput = Omit<
  Job,
  '_id' | 'user' | 'isStale' | 'lastActivityAt' | 'createdAt' | 'updatedAt'
>;

export interface JobFilters {
  status: string;
  search: string;
  tags: string[];
  sortBy: string;
  order: 'asc' | 'desc';
  startDate: string;
  endDate: string;
}

export interface JobsResponse {
  success: boolean;
  data: Job[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AnalyticsData {
  total: number;
  byStatus: Partial<Record<JobStatus, number>>;
  rates: {
    response:  number;
    interview: number;
    offer:     number;
    stale:     number;
  };
  avgDaysToResponse: number | null;
  weekly:  Array<{ _id: { year: number; week: number }; count: number; firstDate: string }>;
  monthly: Array<{ _id: { year: number; month: number }; count: number }>;
  topTags: Array<{ _id: string; count: number }>;
}
