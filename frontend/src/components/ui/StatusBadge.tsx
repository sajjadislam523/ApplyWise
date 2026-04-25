import { cn } from '@/lib/utils';
import { JobStatus } from '@/types/job';

const labels: Record<JobStatus, string> = {
  applied:      'Applied',
  interviewing: 'Interviewing',
  offer:        'Offer',
  rejected:     'Rejected',
  stale:        'Stale',
};

export function StatusBadge({ status, className }: { status: JobStatus; className?: string }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
      `status-${status}`,
      className
    )}>
      {labels[status]}
    </span>
  );
}
