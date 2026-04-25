import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            60 * 1000,  // 1 min — don't refetch unnecessarily
      gcTime:          10 * 60 * 1000,  // 10 min garbage collection
      retry:                1,          // one retry on failure
      refetchOnWindowFocus: false,      // don't blast the API when the user tabs back
    },
    mutations: {
      retry: 0,
    },
  },
});
