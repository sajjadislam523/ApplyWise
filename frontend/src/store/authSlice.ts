import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User } from '@/types/auth';

interface SetCredentialsPayload {
  user: User;
  accessToken: string;
  refreshToken: string;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isInitialised: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Called on login / register success
    setCredentials: (state, action: PayloadAction<SetCredentialsPayload>) => {
      state.user         = action.payload.user;
      state.accessToken  = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      // Persist to localStorage so the token survives a page refresh
      if (typeof window !== 'undefined') {
        localStorage.setItem('applywise_access',  action.payload.accessToken);
        localStorage.setItem('applywise_refresh', action.payload.refreshToken);
        localStorage.setItem('applywise_user',    JSON.stringify(action.payload.user));
      }
    },
    // Called when the silent refresh succeeds (new access token)
    refreshed: (state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) => {
      state.accessToken  = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      if (typeof window !== 'undefined') {
        localStorage.setItem('applywise_access',  action.payload.accessToken);
        localStorage.setItem('applywise_refresh', action.payload.refreshToken);
      }
    },
    // Rehydrate state from localStorage on app boot
    rehydrate: (state) => {
      if (typeof window !== 'undefined') {
        const access  = localStorage.getItem('applywise_access');
        const refresh = localStorage.getItem('applywise_refresh');
        const user    = localStorage.getItem('applywise_user');
        if (access && refresh && user) {
          state.accessToken  = access;
          state.refreshToken = refresh;
          state.user         = JSON.parse(user) as User;
        }
      }
      state.isInitialised = true;
    },
    logout: (state) => {
      state.user         = null;
      state.accessToken  = null;
      state.refreshToken = null;
      state.isInitialised = true;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('applywise_access');
        localStorage.removeItem('applywise_refresh');
        localStorage.removeItem('applywise_user');
      }
    },
  },
});

export const { setCredentials, refreshed, rehydrate, logout } = authSlice.actions;
export default authSlice.reducer;
