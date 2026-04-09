import apiClient from './client';
import type {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  GoogleLoginRequest,
  VerifyOtpRequest,
  AuthResponse,
  CsrfTokenResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  UpdateProfileRequest,
  VerifyLoginTwoFactorRequest,
  TwoFactorSetupResponse,
  TwoFactorEnableRequest,
  TwoFactorDisableRequest,
} from '../types/api.types';
import { store } from '../../store/store';
import { selectRefreshToken } from '../../store/slices/authSlice';
import { getStorageKey, isAdminDomain } from '../../utils/constants';

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
      localStorage.setItem(getStorageKey('CSRF_TOKEN'), csrfToken);
      
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
    
    if (!authData.accessToken && !authData.requiresTwoFactor) {
      throw new Error('Access token not received from server');
    }
    
    return authData;
  },

  /**
   * Verify 2FA OTP for admin login completion
   * This is admin-only by design.
   */
  /**
   * Complete password login after 2FA challenge.
   * Backend uses shared `/api/auth/login/verify-2fa` (pendingToken + code) — no `/api/admin/login/verify-2fa`.
   */
  verifyLoginTwoFactor: async (data: VerifyLoginTwoFactorRequest): Promise<AuthResponse> => {
    if (!isAdminDomain()) {
      throw new Error('2FA login verification is available for admin panel only');
    }

    const response = await apiClient.post<{ data: AuthResponse }>('/api/auth/login/verify-2fa', data);
    const authData = response.data.data;
    if (!authData.accessToken) {
      throw new Error('Access token not received from server');
    }
    return authData;
  },

  /**
   * Start 2FA setup for admin account
   */
  setupTwoFactor: async (): Promise<TwoFactorSetupResponse> => {
    if (!isAdminDomain()) {
      throw new Error('2FA setup is available for admin panel only');
    }

    const response = await apiClient.post<{ data: TwoFactorSetupResponse }>('/api/auth/2fa/setup');
    return response.data.data;
  },

  /**
   * Enable 2FA: API expects `{ code: "123456" }` (6-digit numeric string)
   */
  enableTwoFactor: async (code: string): Promise<{ enabled: boolean }> => {
    if (!isAdminDomain()) {
      throw new Error('2FA enable is available for admin panel only');
    }

    const payload: TwoFactorEnableRequest = { code };
    try {
      const response = await apiClient.post<{ data?: { enabled?: boolean } }>('/api/admin/2fa/enable', payload);
      return { enabled: Boolean(response.data.data?.enabled ?? true) };
    } catch (error: unknown) {
      const apiError = error as { status?: number };
      if (apiError?.status === 404) {
        const fallbackResponse = await apiClient.post<{ data?: { enabled?: boolean } }>('/api/auth/2fa/enable', payload);
        return { enabled: Boolean(fallbackResponse.data.data?.enabled ?? true) };
      }
      throw error;
    }
  },

  /**
   * Disable 2FA: API expects `{ password, code }` per Swagger
   */
  disableTwoFactor: async (data: TwoFactorDisableRequest): Promise<{ enabled: boolean }> => {
    if (!isAdminDomain()) {
      throw new Error('2FA disable is available for admin panel only');
    }

    const payload: TwoFactorDisableRequest = {
      password: data.password,
      code: data.code,
    };
    const response = await apiClient.post<{ data?: { enabled?: boolean } }>('/api/auth/2fa/disable', payload);
    return { enabled: Boolean(response.data.data?.enabled ?? false) };
  },

  /**
   * Register new user
   * Returns message if OTP is required, or AuthResponse if registration completes immediately
   */
  register: async (data: RegisterRequest): Promise<{ message?: string } | AuthResponse> => {
    const response = await apiClient.post<{ data: AuthResponse | { message: string }, message?: string }>('/api/auth/register', data);
    
    const responseData = response.data.data;
    
    // If response has accessToken, registration completed immediately (old flow)
    if ('accessToken' in responseData && responseData.accessToken) {
      return responseData as AuthResponse;
    }
    
    // Otherwise, OTP was sent (new flow)
    return { message: response.data.message || 'OTP sent to your email' };
  },

  /**
   * Forgot password - Send reset email
   */
  forgotPassword: async (data: ForgotPasswordRequest): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/api/auth/forgot-password', data);
    return response.data;
  },

  /**
   * Reset password with OTP and new password
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
    // Use admin endpoint for admin side, auth endpoint for user side
    const isAdmin = isAdminDomain();
    const endpoint = isAdmin ? '/api/admin/logout' : '/api/auth/logout';
    
    // Get refresh token from Redux store
    const state = store.getState();
    const refreshToken: any = selectRefreshToken(state as any);
    
    try {
      // Send refresh token in request body if available
      if (refreshToken) {
        await apiClient.post(endpoint, { refreshToken });
      } else {
        await apiClient.post(endpoint);
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
    const isAdmin = isAdminDomain();

    // Primary endpoint by app mode.
    const primaryEndpoint = isAdmin ? '/api/admin/profile' : '/api/profile';

    try {
      const response = await apiClient.get<{ data: AuthResponse['user'] }>(primaryEndpoint);
      return response.data.data;
    } catch (error: unknown) {
      // Some deployments don't expose /api/admin/profile.
      // Fallback to /api/profile only for admin mode + 404.
      const apiError = error as { status?: number };
      if (isAdmin && apiError?.status === 404) {
        const fallbackResponse = await apiClient.get<{ data: AuthResponse['user'] }>('/api/profile');
        return fallbackResponse.data.data;
      }
      throw error;
    }
  },

  /**
   * Update current user profile
   */
  updateProfile: async (data: UpdateProfileRequest): Promise<AuthResponse['user']> => {
    const isAdmin = isAdminDomain();
    const endpoint = isAdmin ? '/api/admin/profile' : '/api/profile';
    const response = await apiClient.put<{ data: AuthResponse['user'] }>(endpoint, data);
    return response.data.data;
  },

  /**
   * Verify OTP and set password
   * This completes the registration process
   */
  verifyOtp: async (data: VerifyOtpRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<{ data: AuthResponse }>('/api/auth/verify-otp', data);
    
    const authData = response.data.data;
    
    if (!authData.accessToken) {
      throw new Error('Access token not received from server');
    }
    
    return authData;
  },

  /**
   * Refresh access token using refresh token
   * Get a new access token using a valid refresh token
   * Uses /api/auth/refresh-token endpoint
   */
  refreshToken: async (data: RefreshTokenRequest): Promise<RefreshTokenResponse> => {
    const endpoint = '/api/auth/refresh-token';
    const response = await apiClient.post<{ data: RefreshTokenResponse }>(endpoint, data);
    
    const tokenData = response.data.data;
    
    if (!tokenData.accessToken) {
      throw new Error('Access token not received from server');
    }
    
    return tokenData;
  },
};

