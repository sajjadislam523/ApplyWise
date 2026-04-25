import api from './axios';
import {
  Job,
  CreateJobInput,
  JobsResponse,
  JobFilters,
  AnalyticsData,
} from '@/types/job';
import { User, LoginInput, RegisterInput } from '@/types/auth';

// ─── Helpers ──────────────────────────────────────────────────────────────

// Build query string from filters — only includes non-empty values
const buildJobParams = (filters: Partial<JobFilters> & { page?: number; limit?: number }) => {
  const params = new URLSearchParams();
  if (filters.status)    params.set('status',    filters.status);
  if (filters.search)    params.set('search',    filters.search);
  if (filters.tags?.length) params.set('tags',   filters.tags.join(','));
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate)   params.set('endDate',   filters.endDate);
  if (filters.sortBy)    params.set('sortBy',    filters.sortBy);
  if (filters.order)     params.set('order',     filters.order);
  if (filters.page)      params.set('page',      String(filters.page));
  if (filters.limit)     params.set('limit',     String(filters.limit));
  return params.toString();
};

// ─── Auth ─────────────────────────────────────────────────────────────────

export const authApi = {
  register: async (input: RegisterInput) => {
    const { data } = await api.post<{ data: { user: User; accessToken: string; refreshToken: string } }>(
      '/auth/register',
      input
    );
    return data.data;
  },

  login: async (input: LoginInput) => {
    const { data } = await api.post<{ data: { user: User; accessToken: string; refreshToken: string } }>(
      '/auth/login',
      input
    );
    return data.data;
  },

  logout: async (refreshToken: string) => {
    await api.post('/auth/logout', { refreshToken });
  },

  getMe: async () => {
    const { data } = await api.get<{ data: User }>('/auth/me');
    return data.data;
  },
};

// ─── Jobs ─────────────────────────────────────────────────────────────────

export const jobsApi = {
  getAll: async (filters: Partial<JobFilters> & { page?: number; limit?: number }) => {
    const qs = buildJobParams(filters);
    const { data } = await api.get<JobsResponse>(`/jobs${qs ? `?${qs}` : ''}`);
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<{ data: Job }>(`/jobs/${id}`);
    return data.data;
  },

  create: async (input: CreateJobInput) => {
    const { data } = await api.post<{ data: Job }>('/jobs', input);
    return data.data;
  },

  update: async ({ id, ...input }: Partial<Job> & { id: string }) => {
    const { data } = await api.put<{ data: Job }>(`/jobs/${id}`, input);
    return data.data;
  },

  delete: async (id: string) => {
    await api.delete(`/jobs/${id}`);
  },

  getAnalytics: async () => {
    const { data } = await api.get<{ data: AnalyticsData }>('/jobs/analytics');
    return data.data;
  },
};
