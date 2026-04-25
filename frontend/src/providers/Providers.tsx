'use client';

import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { store } from '@/store';
import { rehydrate } from '@/store/authSlice';
import { queryClient } from '@/lib/queryClient';

function AuthRehydrator({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Restore auth state from localStorage on first mount
    store.dispatch(rehydrate());
  }, []);
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthRehydrator>
          {children}
        </AuthRehydrator>
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </Provider>
  );
}
