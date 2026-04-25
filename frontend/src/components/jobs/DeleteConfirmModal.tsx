'use client';

import { useAppDispatch, useAppSelector } from '@/store';
import { closeDeleteConfirm } from '@/store/uiSlice';
import { useDeleteJob } from '@/hooks/useJobs';
import { Button } from '@/components/ui/Button';

export function DeleteConfirmModal() {
  const dispatch = useAppDispatch();
  const { isDeleteConfirmOpen, deletingJobId } = useAppSelector((s) => s.ui);
  const { mutate: deleteJob, isPending } = useDeleteJob();

  if (!isDeleteConfirmOpen || !deletingJobId) return null;

  const confirm = () => deleteJob(deletingJobId, { onSuccess: () => dispatch(closeDeleteConfirm()) });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs"
           onClick={() => dispatch(closeDeleteConfirm())} />
      <div className="relative rounded-2xl border border-white/10 bg-[#0F1419] shadow-2xl
                      w-full max-w-sm mx-4 p-6">
        <h2 className="font-display font-600 text-base text-white mb-2">Delete application?</h2>
        <p className="text-sm text-[#8B98A8] mb-6">This cannot be undone.</p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => dispatch(closeDeleteConfirm())}>
            Cancel
          </Button>
          <Button variant="danger" className="flex-1" loading={isPending} onClick={confirm}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
