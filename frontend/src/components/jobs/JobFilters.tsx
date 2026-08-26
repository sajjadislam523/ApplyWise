'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setStatus, setSearch, resetFilters } from '@/store/filterSlice';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { JobStatus } from '@/types/job';

const STATUS_OPTIONS = [
  { value: 'applied',      label: 'Applied'      },
  { value: 'interviewing', label: 'Interviewing'  },
  { value: 'offer',        label: 'Offer'         },
  { value: 'rejected',     label: 'Rejected'      },
  { value: 'stale',        label: 'Stale'         },
];

export function JobFilters() {
  const dispatch = useAppDispatch();
  const { status, search } = useAppSelector((s) => s.filters);

  // The Redux search value feeds the React Query key, so dispatching on every
  // keystroke fires one request per character. Hold a local draft and push it
  // to Redux only after the user pauses.
  const [draft, setDraft] = useState(search);

  useEffect(() => {
    if (draft === search) return;
    const timer = setTimeout(() => dispatch(setSearch(draft)), 300);
    return () => clearTimeout(timer);
  }, [draft, search, dispatch]);

  // resetFilters() clears Redux from outside this component — mirror it back.
  useEffect(() => {
    if (search === '') setDraft('');
  }, [search]);

  const hasActive = status !== '' || search !== '';

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-64">
        <Input
          aria-label="Search applications"
          type="search"
          placeholder="Search title or company…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      </div>
      <div className="w-44">
        <Select
          aria-label="Filter by status"
          placeholder="All statuses"
          value={status}
          onChange={(e) => dispatch(setStatus(e.target.value as JobStatus | ''))}
          options={STATUS_OPTIONS}
        />
      </div>
      {hasActive && (
        <Button variant="ghost" size="sm" onClick={() => dispatch(resetFilters())}>
          Clear
        </Button>
      )}
    </div>
  );
}
