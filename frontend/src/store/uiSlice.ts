import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  isJobModalOpen:    boolean;
  editingJobId:      string | null; // null = creating new, string = editing existing
  isSidebarOpen:     boolean;
  isDeleteConfirmOpen: boolean;
  deletingJobId:     string | null;
}

const initialState: UIState = {
  isJobModalOpen:      false,
  editingJobId:        null,
  isSidebarOpen:       true,
  isDeleteConfirmOpen: false,
  deletingJobId:       null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openCreateModal: (state) => {
      state.isJobModalOpen = true;
      state.editingJobId   = null;
    },
    openEditModal: (state, { payload }: PayloadAction<string>) => {
      state.isJobModalOpen = true;
      state.editingJobId   = payload;
    },
    closeJobModal: (state) => {
      state.isJobModalOpen = false;
      state.editingJobId   = null;
    },
    openDeleteConfirm: (state, { payload }: PayloadAction<string>) => {
      state.isDeleteConfirmOpen = true;
      state.deletingJobId       = payload;
    },
    closeDeleteConfirm: (state) => {
      state.isDeleteConfirmOpen = false;
      state.deletingJobId       = null;
    },
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
  },
});

export const {
  openCreateModal,
  openEditModal,
  closeJobModal,
  openDeleteConfirm,
  closeDeleteConfirm,
  toggleSidebar,
} = uiSlice.actions;
export default uiSlice.reducer;
