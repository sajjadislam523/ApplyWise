import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAppSelector } from '@/store';
import { jobsApi } from '@/lib/api';
import { CreateJobInput, Job } from '@/types/job';

// ─── Query keys ───────────────────────────────────────────────────────────
// Centralise keys so invalidation is always consistent
export const jobKeys = {
  all:       ['jobs']                                 as const,
  filtered:  (filters: object) => ['jobs', filters]  as const,
  detail:    (id: string) => ['jobs', id]             as const,
  analytics: ['jobs', 'analytics']                   as const,
};

// ─── List with auto-connected filters ────────────────────────────────────
export const useJobs = (page = 1) => {
  const filters = useAppSelector((s) => s.filters);
  const userId  = useAppSelector((s) => s.auth.user?.id);

  // queryKey includes both userId and all filters.
  // Any filter change in Redux triggers an automatic background refetch.
  return useQuery({
    queryKey: jobKeys.filtered({ ...filters, page, userId }),
    queryFn:  () => jobsApi.getAll({ ...filters, page }),
    enabled:  !!userId,
    placeholderData: (prev) => prev, // keep showing old data while new page loads
  });
};

// ─── Single job detail ────────────────────────────────────────────────────
export const useJob = (id: string | null) => {
  return useQuery({
    queryKey: jobKeys.detail(id!),
    queryFn:  () => jobsApi.getById(id!),
    enabled:  !!id,
  });
};

// ─── Analytics ───────────────────────────────────────────────────────────
export const useAnalytics = () => {
  const userId = useAppSelector((s) => s.auth.user?.id);
  return useQuery({
    queryKey: jobKeys.analytics,
    queryFn:  jobsApi.getAnalytics,
    enabled:  !!userId,
    staleTime: 5 * 60 * 1000, // analytics can be 5 min stale — less critical
  });
};

// ─── Mutations ────────────────────────────────────────────────────────────

export const useCreateJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateJobInput) => jobsApi.create(data),
    onSuccess: () => {
      // Invalidate all job list queries — filters may have changed
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
      queryClient.invalidateQueries({ queryKey: jobKeys.analytics });
    },
  });
};

export const useUpdateJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Job> & { id: string }) => jobsApi.update(data),
    onSuccess: (updatedJob) => {
      // Update the detail cache immediately — no need to refetch
      queryClient.setQueryData(jobKeys.detail(updatedJob._id), updatedJob);
      // Invalidate the list so the card reflects changes
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
      queryClient.invalidateQueries({ queryKey: jobKeys.analytics });
    },
  });
};

export const useDeleteJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobsApi.delete(id),
    onSuccess: (_data, id) => {
      // Remove from detail cache
      queryClient.removeQueries({ queryKey: jobKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
      queryClient.invalidateQueries({ queryKey: jobKeys.analytics });
    },
  });
};
