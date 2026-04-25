'use client';

import { useState, useEffect } from 'react';
import { Job, CreateJobInput, JobStatus, LocationType } from '@/types/job';
import { useCreateJob, useUpdateJob, useJob } from '@/hooks/useJobs';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useAppDispatch } from '@/store';
import { closeJobModal } from '@/store/uiSlice';
import dayjs from 'dayjs';

const STATUS_OPTIONS: { value: JobStatus; label: string }[] = [
  { value: 'applied',      label: 'Applied'      },
  { value: 'interviewing', label: 'Interviewing'  },
  { value: 'offer',        label: 'Offer'         },
  { value: 'rejected',     label: 'Rejected'      },
];
const LOCATION_OPTIONS: { value: LocationType; label: string }[] = [
  { value: 'remote', label: 'Remote'  },
  { value: 'onsite', label: 'On-site' },
  { value: 'hybrid', label: 'Hybrid'  },
];
const EMPTY: CreateJobInput = {
  title: '', company: '', location: 'remote', salary: '',
  applicationDate: dayjs().format('YYYY-MM-DD'), status: 'applied',
  noticePeriod: '', jobLink: '', tags: [], followUpSent: false,
  followUpDate: undefined, timeoutDays: 14, description: '',
};

export function JobForm({ editingId }: { editingId: string | null }) {
  const dispatch = useAppDispatch();
  const { data: existingJob } = useJob(editingId);
  const { mutate: createJob, isPending: creating, error: createError } = useCreateJob();
  const { mutate: updateJob, isPending: updating, error: updateError } = useUpdateJob();
  const [form, setForm] = useState<CreateJobInput>(EMPTY);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (existingJob) {
      setForm({
        title: existingJob.title, company: existingJob.company, location: existingJob.location,
        salary: existingJob.salary || '', applicationDate: dayjs(existingJob.applicationDate).format('YYYY-MM-DD'),
        status: existingJob.status, noticePeriod: existingJob.noticePeriod || '',
        jobLink: existingJob.jobLink || '', tags: existingJob.tags, followUpSent: existingJob.followUpSent,
        followUpDate: existingJob.followUpDate ? dayjs(existingJob.followUpDate).format('YYYY-MM-DD') : undefined,
        timeoutDays: existingJob.timeoutDays, description: existingJob.description || '',
      });
    }
  }, [existingJob]);

  const set = (field: keyof CreateJobInput, value: unknown) =>
    setForm((p) => ({ ...p, [field]: value }));

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) set('tags', [...form.tags, t]);
    setTagInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateJob({ id: editingId, ...form }, { onSuccess: () => dispatch(closeJobModal()) });
    } else {
      createJob(form, { onSuccess: () => dispatch(closeJobModal()) });
    }
  };

  const isPending = creating || updating;
  const apiError = ((createError || updateError) as { response?: { data?: { message?: string } } })
    ?.response?.data?.message;

  const fieldClass = "h-9 w-full rounded-lg border bg-white/[0.04] px-3 text-sm text-white placeholder:text-[#4A5568] border-white/[0.08] focus:border-[#6EE7B7]/50 focus:outline-none focus:ring-1 focus:ring-[#6EE7B7]/30 transition-colors";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Job title" value={form.title} onChange={(e) => set('title', e.target.value)}
          required placeholder="Software Engineer" />
        <Input label="Company" value={form.company} onChange={(e) => set('company', e.target.value)}
          required placeholder="Acme Corp" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Select label="Status" value={form.status}
          onChange={(e) => set('status', e.target.value as JobStatus)} options={STATUS_OPTIONS} />
        <Select label="Location" value={form.location || ''}
          onChange={(e) => set('location', e.target.value as LocationType)}
          options={LOCATION_OPTIONS} placeholder="Select..." />
        <Input label="Applied on" type="date" value={form.applicationDate as string}
          onChange={(e) => set('applicationDate', e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Salary range" value={form.salary}
          onChange={(e) => set('salary', e.target.value)} placeholder="$80k – $100k" />
        <Input label="Notice period" value={form.noticePeriod}
          onChange={(e) => set('noticePeriod', e.target.value)} placeholder="2 weeks" />
      </div>

      <Input label="Job posting URL" value={form.jobLink}
        onChange={(e) => set('jobLink', e.target.value)} placeholder="https://..." />

      {/* Tags */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-[#8B98A8] uppercase tracking-wide">Tags</label>
        <div className="flex gap-2">
          <input className={fieldClass} placeholder="Add tag and press Enter"
            value={tagInput} onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} />
          <Button type="button" variant="secondary" size="sm" onClick={addTag}>Add</Button>
        </div>
        {form.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {form.tags.map((t) => (
              <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs
                                        bg-white/[0.05] text-[#8B98A8] border border-white/[0.06]">
                {t}
                <button type="button" onClick={() => set('tags', form.tags.filter((x) => x !== t))}
                  className="text-[#4A5568] hover:text-white">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Follow-up + Timeout */}
      <div className="flex items-center gap-4 p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
        <label className="flex items-center gap-2 text-sm text-[#8B98A8] cursor-pointer">
          <input type="checkbox" checked={form.followUpSent}
            onChange={(e) => set('followUpSent', e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-white/5 accent-[#6EE7B7]" />
          Follow-up sent
        </label>
        {form.followUpSent && (
          <input type="date" value={form.followUpDate as string || ''}
            onChange={(e) => set('followUpDate', e.target.value)}
            className={`${fieldClass} w-40`} />
        )}
        <div className="ml-auto flex items-center gap-2 text-sm">
          <label className="text-[#8B98A8]">Timeout</label>
          <input type="number" min={1} max={365} value={form.timeoutDays}
            onChange={(e) => set('timeoutDays', parseInt(e.target.value, 10))}
            className="w-16 h-8 text-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-sm text-white focus:outline-none focus:border-[#6EE7B7]/50" />
          <span className="text-[#4A5568] text-xs">days</span>
        </div>
      </div>

      {apiError && (
        <p className="text-sm text-red-400 bg-red-950/50 border border-red-900/50 rounded-lg px-3 py-2">
          {apiError}
        </p>
      )}

      <div className="flex gap-3 pt-2 border-t border-white/[0.06]">
        <Button type="button" variant="secondary" className="flex-1"
          onClick={() => dispatch(closeJobModal())}>Cancel</Button>
        <Button type="submit" className="flex-1" loading={isPending}>
          {editingId ? 'Save changes' : 'Add application'}
        </Button>
      </div>
    </form>
  );
}
