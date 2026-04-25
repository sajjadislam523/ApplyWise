import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { JobFilters, JobStatus } from '@/types/job';

const initialState: JobFilters = {
  status:    '',
  search:    '',
  tags:      [],
  sortBy:    'applicationDate',
  order:     'desc',
  startDate: '',
  endDate:   '',
};

const filterSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setStatus:    (state, { payload }: PayloadAction<JobStatus | ''>) => { state.status    = payload; },
    setSearch:    (state, { payload }: PayloadAction<string>)         => { state.search    = payload; },
    setTags:      (state, { payload }: PayloadAction<string[]>)       => { state.tags      = payload; },
    addTag: (state, { payload }: PayloadAction<string>) => {
      if (!state.tags.includes(payload)) state.tags.push(payload);
    },
    removeTag: (state, { payload }: PayloadAction<string>) => {
      state.tags = state.tags.filter((t) => t !== payload);
    },
    setSort: (state, { payload }: PayloadAction<{ sortBy: string; order: 'asc' | 'desc' }>) => {
      state.sortBy = payload.sortBy;
      state.order  = payload.order;
    },
    setDateRange: (state, { payload }: PayloadAction<{ startDate: string; endDate: string }>) => {
      state.startDate = payload.startDate;
      state.endDate   = payload.endDate;
    },
    resetFilters: () => initialState,
  },
});

export const { setStatus, setSearch, setTags, addTag, removeTag, setSort, setDateRange, resetFilters } =
  filterSlice.actions;
export default filterSlice.reducer;
