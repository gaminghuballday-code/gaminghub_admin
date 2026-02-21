import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '@services/types/api.types';
import { getStorageKey } from '@utils/constants';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

// Load initial state from localStorage (for persistence)
const getInitialState = (): AuthState => {
  const accessTokenKey = getStorageKey('AUTH_TOKEN');
  const refreshTokenKey = getStorageKey('REFRESH_TOKEN');
  const userKey = getStorageKey('USER');

  const accessToken = localStorage.getItem(accessTokenKey);
  const refreshToken = localStorage.getItem(refreshTokenKey);
  const userStr = localStorage.getItem(userKey);
  
  return {
    accessToken,
    refreshToken,
    user: userStr ? JSON.parse(userStr) : null,
    isAuthenticated: !!accessToken,
  };
};

const initialState: AuthState = getInitialState();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        accessToken: string;
        refreshToken?: string;
        user: User;
      }>
    ) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken || null;
      // Login / Google login response is the source of truth for role
      state.user = action.payload.user;
      state.isAuthenticated = true;
      
      // Persist to localStorage with namespaced keys
      localStorage.setItem(getStorageKey('AUTH_TOKEN'), action.payload.accessToken);
      if (action.payload.refreshToken) {
        localStorage.setItem(getStorageKey('REFRESH_TOKEN'), action.payload.refreshToken);
      }
      localStorage.setItem(getStorageKey('USER'), JSON.stringify(action.payload.user));
    },
    setUser: (state, action: PayloadAction<User>) => {
      // Profile API might not include role anymore.
      // Preserve existing role from login if the incoming user has no role.
      const existingRole = state.user?.role;
      const incoming = action.payload;
      const mergedUser: User = {
        ...(state.user || {}),
        ...incoming,
        role: incoming.role ?? existingRole,
      };

      state.user = mergedUser;
      localStorage.setItem(getStorageKey('USER'), JSON.stringify(mergedUser));
    },
    logout: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.isAuthenticated = false;
      
      // Clear namespaced localStorage items
      localStorage.removeItem(getStorageKey('AUTH_TOKEN'));
      localStorage.removeItem(getStorageKey('REFRESH_TOKEN'));
      localStorage.removeItem(getStorageKey('USER'));
    },
    updateToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      localStorage.setItem(getStorageKey('AUTH_TOKEN'), action.payload);
    },
    updateTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken?: string }>) => {
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = !!action.payload.accessToken;
      localStorage.setItem(getStorageKey('AUTH_TOKEN'), action.payload.accessToken);
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
        localStorage.setItem(getStorageKey('REFRESH_TOKEN'), action.payload.refreshToken);
      }
    },
  },
});

export const { setCredentials, setUser, logout, updateToken, updateTokens } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectAccessToken = (state: { auth: AuthState }) => state.auth.accessToken;
export const selectRefreshToken = (state: { auth: AuthState }) => state.auth.refreshToken;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;

