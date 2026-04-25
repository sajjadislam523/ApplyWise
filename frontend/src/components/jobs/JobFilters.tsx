'use client';

import { useCallback } from 'react';
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

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => dispatch(setSearch(e.target.value)),
    [dispatch]
  );

  const hasActive = status !== '' || search !== '';

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-64">
        <Input placeholder="Search title or company..." value={search} onChange={handleSearch} />
      </div>
      <div className="w-44">
        <Select
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
