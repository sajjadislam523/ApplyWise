'use client';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Job } from '@/types/job';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useAppDispatch } from '@/store';
import { openEditModal, openDeleteConfirm } from '@/store/uiSlice';

dayjs.extend(relativeTime);

export function JobCard({ job }: { job: Job }) {
  const dispatch = useAppDispatch();

  return (
    <div className={cn(
      'group relative rounded-xl border border-white/[0.07] bg-[#0F1419] p-5 flex flex-col gap-3',
      'hover:border-white/[0.14] hover:bg-[#161C24] transition-all duration-200',
      job.isStale && 'card-stale'
    )}>
      {/* accent line */}
      <div className={cn(
        'absolute top-0 left-0 right-0 h-px rounded-t-xl transition-opacity',
        job.isStale
          ? 'bg-neutral-700 opacity-50'
          : 'bg-linear-to-r from-transparent via-[#6EE7B7]/30 to-transparent opacity-0 group-hover:opacity-100'
      )} />

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn('font-display font-600 text-sm text-white truncate job-title',
            job.isStale && 'line-through text-[#4A5568]')}>
            {job.title}
          </p>
          <p className="text-sm text-[#8B98A8] mt-0.5 truncate">{job.company}</p>
        </div>
        <StatusBadge status={job.status} />
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#4A5568]">
        {job.location && <span className="capitalize">{job.location}</span>}
        {job.salary   && <span>{job.salary}</span>}
        <span>{dayjs(job.applicationDate).format('MMM D, YYYY')}</span>
        {job.followUpSent && <span className="text-[#6EE7B7]">✓ Followed up</span>}
      </div>

      {/* Tags */}
      {job.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {job.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded-md text-xs
                                        bg-white/5 text-[#8B98A8] border border-white/6">
              {tag}
            </span>
          ))}
        </div>
      )}

      {job.isStale && (
        <p className="text-xs text-[#4A5568] italic">No activity for {job.timeoutDays} days</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-white/5">
        <Button variant="ghost" size="sm" className="flex-1 text-xs" onClick={() => dispatch(openEditModal(job._id))}>
          Edit
        </Button>
        {job.jobLink && (
          <Button variant="ghost" size="sm" className="flex-1 text-xs"
            onClick={() => window.open(job.jobLink, '_blank')}>
            View ↗
          </Button>
        )}
        <Button variant="ghost" size="sm"
          className="text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30"
          onClick={() => dispatch(openDeleteConfirm(job._id))}>
          Delete
        </Button>
      </div>
    </div>
  );
}
