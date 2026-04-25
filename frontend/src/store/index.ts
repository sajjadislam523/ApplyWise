import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer   from './authSlice';
import filterReducer from './filterSlice';
import uiReducer     from './uiSlice';

export const store = configureStore({
  reducer: {
    auth:    authReducer,
    filters: filterReducer,
    ui:      uiReducer,
  },
});

export type RootState    = ReturnType<typeof store.getState>;
export type AppDispatch  = typeof store.dispatch;

// Pre-typed hooks — import these everywhere instead of raw useDispatch/useSelector
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
