'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isInitialised } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (isInitialised && !user) router.replace('/auth/login');
  }, [user, isInitialised, router]);

  if (!isInitialised) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080C10]">
        <div className="w-5 h-5 border-2 border-[#6EE7B7] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-[#080C10]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
