import apiClient from './client';
import type { LoginRequest, RegisterRequest, ForgotPasswordRequest, ResetPasswordRequest, GoogleLoginRequest, AuthResponse, CsrfTokenResponse } from '../types/api.types';
import { store } from '../../store/store';
import { selectRefreshToken } from '../../store/slices/authSlice';
import { STORAGE_KEYS, isAdminDomain } from '../../utils/constants';

export const authApi = {
  /**
   * Get CSRF token for state-changing requests
   * Token is stored in localStorage and also set in XSRF-TOKEN cookie by backend
   */
  getCsrfToken: async (): Promise<string> => {
    try {
      // Use admin endpoint for admin side, auth endpoint for user side
      const isAdmin = isAdminDomain();
      const endpoint = isAdmin ? '/api/admin/csrf-token' : '/api/auth/csrf-token';
      const response = await apiClient.get<{ data: CsrfTokenResponse }>(endpoint);
      const csrfToken = response.data.data.csrfToken;
      
      if (!csrfToken) {
        throw new Error('CSRF token not received from server');
      }
      
      // Store CSRF token in localStorage
      localStorage.setItem(STORAGE_KEYS.CSRF_TOKEN, csrfToken);
      
      return csrfToken;
    } catch (error: any) {
      console.error('Failed to fetch CSRF token:', error);
      // Re-throw error so calling code can handle it properly
      throw error;
    }
  },
  /**
   * Login user
   * Note: Redux state will be updated by the component calling this
   * Uses /api/admin/login for admin side, /api/auth/login for user side
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    // Use admin endpoint for admin side, auth endpoint for user side
    const isAdmin = isAdminDomain();
    const endpoint = isAdmin ? '/api/admin/login' : '/api/auth/login';
    const response = await apiClient.post<{ data: AuthResponse }>(endpoint, data);
    
    // API returns { status, success, message, data: { accessToken, refreshToken, user } }
    const authData = response.data.data;
    
    if (!authData.accessToken) {
      throw new Error('Access token not received from server');
    }
    
    return authData;
  },

  /**
   * Register new user
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<{ data: AuthResponse }>('/api/auth/register', data);
    
    const authData = response.data.data;
    
    if (!authData.accessToken) {
      throw new Error('Access token not received from server');
    }
    
    return authData;
  },

  /**
   * Forgot password - Send reset email
   */
  forgotPassword: async (data: ForgotPasswordRequest): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/api/auth/forgot-password', data);
    return response.data;
  },

  /**
   * Reset password with token
   */
  resetPassword: async (data: ResetPasswordRequest): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/api/auth/reset-password', data);
    return response.data;
  },

  /**
   * Google login - Authenticate with Google ID token
   * Uses Google OAuth client-side, then sends ID token to backend
   */
  googleLogin: async (idToken: string, name?: string): Promise<AuthResponse> => {
    const response = await apiClient.post<{ data: AuthResponse }>('/api/auth/google-login', {
      idToken,
      name,
    } as GoogleLoginRequest);
    
    // API returns { status, success, message, data: { accessToken, refreshToken, user } }
    const authData = response.data.data;
    
    if (!authData.accessToken) {
      throw new Error('Access token not received from server');
    }
    
    return authData;
  },

  /**
   * Logout user
   * Note: Redux state will be updated by the component calling this
   */
  logout: async (): Promise<void> => {
    // Get refresh token from Redux store
    const state = store.getState();
    const refreshToken:any = selectRefreshToken(state as any);
    
    try {
      // Send refresh token in request body if available
      if (refreshToken) {
        await apiClient.post('/api/auth/logout', { refreshToken });
      } else {
        await apiClient.post('/api/auth/logout');
      }
    } catch (error: any) {
      // Silently ignore 404 or route not found errors
      // Logout endpoint might not exist on backend, which is fine
      if (error?.response?.status !== 404) {
        console.warn('Logout API call failed:', error?.message || 'Unknown error');
      }
      // Continue with logout even if API call fails
    }
    // Note: Redux state will be cleared by the component
  },

  /**
   * Get current user profile
   */
  getProfile: async (): Promise<AuthResponse['user']> => {
    const response = await apiClient.get<AuthResponse['user']>('/api/auth/profile');
    return response.data;
  },
};

