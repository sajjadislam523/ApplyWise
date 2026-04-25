'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { closeJobModal } from '@/store/uiSlice';
import { JobForm } from './JobForm';

export function JobModal() {
  const dispatch = useAppDispatch();
  const { isJobModalOpen, editingJobId } = useAppSelector((s) => s.ui);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') dispatch(closeJobModal()); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [dispatch]);

  useEffect(() => {
    document.body.style.overflow = isJobModalOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isJobModalOpen]);

  if (!isJobModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"
           onClick={() => dispatch(closeJobModal())} />
      <div className="relative rounded-2xl border border-white/[0.1] bg-[#0F1419] shadow-2xl
                      w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        <div className="sticky top-0 bg-[#0F1419] border-b border-white/[0.07] px-6 py-4
                        flex items-center justify-between z-10">
          <h2 className="font-display font-600 text-base text-white">
            {editingJobId ? 'Edit application' : 'New application'}
          </h2>
          <button onClick={() => dispatch(closeJobModal())}
            className="text-[#4A5568] hover:text-white text-lg leading-none transition-colors">
            ✕
          </button>
        </div>
        <div className="p-6">
          <JobForm editingId={editingJobId} />
        </div>
      </div>
    </div>
  );
}
