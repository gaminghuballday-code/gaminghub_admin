import axios, { AxiosError } from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, CancelTokenSource } from 'axios';
import type { ApiError } from '../types/api.types';
import { store } from '../../store/store';
import { selectAccessToken, selectRefreshToken, logout, updateTokens } from '../../store/slices/authSlice';
import { addToast } from '../../store/slices/toastSlice';
import { STORAGE_KEYS, isAdminDomain } from '../../utils/constants';

// Use relative URLs to leverage proxy (Vite in dev, Vercel in production)
// This avoids CORS issues by making requests from the same origin
// Override with VITE_API_BASE_URL if you need direct API calls
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 10000;

// Request deduplication - prevent duplicate requests
const pendingRequests = new Map<string, CancelTokenSource>();

// Track refresh token request to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  withCredentials: true, // Enable sending cookies (for XSRF-TOKEN cookie)
  headers: {
    'Content-Type': 'application/json',
  },
});

  // Request interceptor - Add auth token, CSRF token, deduplicate requests, and show loading
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const state = store.getState();
    const token = selectAccessToken(state);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add CSRF token for state-changing requests (POST, PUT, DELETE, PATCH)
    const method = config.method?.toUpperCase();
    if (method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      // Try to get CSRF token from localStorage first
      let csrfToken = localStorage.getItem(STORAGE_KEYS.CSRF_TOKEN);
      
      // If not in localStorage, try to get from XSRF-TOKEN cookie (set by backend)
      if (!csrfToken) {
        const cookies = document.cookie.split(';');
        const xsrfCookie = cookies.find(cookie => cookie.trim().startsWith('XSRF-TOKEN='));
        if (xsrfCookie) {
          csrfToken = decodeURIComponent(xsrfCookie.split('=')[1]);
          // Store in localStorage for future use
          if (csrfToken) {
            localStorage.setItem(STORAGE_KEYS.CSRF_TOKEN, csrfToken);
          }
        }
      }
      
      if (csrfToken && config.headers) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }

    // Request deduplication - cancel duplicate requests within 200ms
    // Include query params in key to differentiate requests with different params
    const paramsString = config.params ? JSON.stringify(config.params) : '';
    const requestKey = `${config.method?.toUpperCase()}_${config.url}_${paramsString}`;
    const existingRequest = pendingRequests.get(requestKey);

    if (existingRequest) {
      // Cancel the previous request
      existingRequest.cancel('Duplicate request cancelled');
    }

    // Create cancel token for this request
    const cancelTokenSource = axios.CancelToken.source();
    config.cancelToken = cancelTokenSource.token;
    pendingRequests.set(requestKey, cancelTokenSource);

    // Clean up after request completes (with delay to handle rapid duplicates)
    setTimeout(() => {
      pendingRequests.delete(requestKey);
    }, 200);

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors, clean up pending requests, and stop loading
apiClient.interceptors.response.use(
  (response) => {
    // Clean up pending request
    const requestKey = `${response.config.method?.toUpperCase()}_${response.config.url}`;
    pendingRequests.delete(requestKey);
    
    // Update CSRF token from response header or cookie if present
    const csrfTokenFromHeader = response.headers['x-csrf-token'];
    if (csrfTokenFromHeader) {
      localStorage.setItem(STORAGE_KEYS.CSRF_TOKEN, csrfTokenFromHeader);
    } else {
      // Also check for XSRF-TOKEN cookie (backend sets this)
      const cookies = document.cookie.split(';');
      const xsrfCookie = cookies.find(cookie => cookie.trim().startsWith('XSRF-TOKEN='));
      if (xsrfCookie) {
        const csrfTokenFromCookie = decodeURIComponent(xsrfCookie.split('=')[1]);
        if (csrfTokenFromCookie) {
          localStorage.setItem(STORAGE_KEYS.CSRF_TOKEN, csrfTokenFromCookie);
        }
      }
    }
    
    // Show success toast if response has a message (exclude GET requests)
    // GET requests are usually just data fetching, so don't show success toasts
    // Note: TanStack Query handles loading states, so we don't dispatch loading actions
    const method = response.config.method?.toUpperCase();
    if (method && method !== 'GET' && response.data && typeof response.data === 'object' && 'message' in response.data) {
      const message = (response.data as { message?: string }).message;
      if (message && typeof message === 'string' && message.trim().length > 0) {
        store.dispatch(addToast({
          message: message.trim(),
          type: 'success',
          duration: 5000,
        }));
      }
    }
    
    return response;
  },
  (error: AxiosError) => {
    // Clean up pending request
    if (error.config) {
      const requestKey = `${error.config.method?.toUpperCase()}_${error.config.url}`;
      pendingRequests.delete(requestKey);
    }

    // Handle cancelled requests (deduplication)
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const apiError: ApiError = {
      message: error.message || 'An error occurred',
      status: error.response?.status,
    };

    if (error.response?.data) {
      const data = error.response.data as any;

      // Prefer top-level message when available
      if (typeof data.message === 'string' && data.message.trim().length > 0) {
        apiError.message = data.message.trim();
      }

      // Fallbacks for common API shapes: { data: { message } } or { error: string }
      else if (data.data && typeof data.data === 'object') {
        const nestedMessage = (data.data as any).message;
        if (typeof nestedMessage === 'string' && nestedMessage.trim().length > 0) {
          apiError.message = nestedMessage.trim();
        }
      } else if (typeof data.error === 'string' && data.error.trim().length > 0) {
        apiError.message = data.error.trim();
      }

      if (data.errors) {
        apiError.errors = data.errors as Record<string, string[]>;
      }
    }

    // Handle 401 Unauthorized - attempt token refresh if refresh token exists
    if (error.response?.status === 401) {
      const state = store.getState();
      const refreshToken = selectRefreshToken(state as any);
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      // Skip refresh if this is already a retry after refresh, or if we're on login page
      const isOnLoginPage = window.location.pathname.includes('/login');
      if (originalRequest?._retry || isOnLoginPage) {
        if (!isOnLoginPage) {
          store.dispatch(logout());
          window.location.href = '/login';
        }
        return Promise.reject(apiError);
      }

      // Attempt token refresh if refresh token exists
      if (refreshToken && !isRefreshing) {
        isRefreshing = true;
        originalRequest._retry = true;

        // Determine refresh endpoint based on domain (admin vs user)
        const isAdmin = isAdminDomain();
        const refreshEndpoint = isAdmin ? '/api/admin/refresh-token' : '/api/auth/refresh-token';
        
        // Use axios directly to avoid circular dependency (apiClient uses interceptors)
        // Request body: { refreshToken: string }
        // Note: Using axios directly means response format is { data: { data: {...} } } (wrapped by backend)
        return axios
          .post<{ data: { accessToken: string; refreshToken?: string } }>(
            `${API_BASE_URL}${refreshEndpoint}`,
            { refreshToken } as { refreshToken: string },
            { 
              withCredentials: true,
              headers: {
                'Content-Type': 'application/json',
              }
            }
          )
          .then((response) => {
            // Handle both response formats: { data: { accessToken, refreshToken } } or { accessToken, refreshToken }
            const responseData = (response.data as any)?.data || response.data;
            const { accessToken, refreshToken: newRefreshToken } = responseData;
            
            if (!accessToken) {
              throw new Error('Access token not received from refresh token response');
            }
            
            // Update tokens in store and localStorage
            store.dispatch(updateTokens({
              accessToken,
              refreshToken: newRefreshToken,
            }));

            // Update authorization header for retry
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }

            // Process queued requests
            isRefreshing = false;
            failedQueue.forEach((prom) => prom.resolve());
            failedQueue = [];

            // Retry original request
            return apiClient(originalRequest);
          })
          .catch((refreshError) => {
            // Refresh failed - reject queued requests and logout
            isRefreshing = false;
            failedQueue.forEach((prom) => prom.reject(refreshError));
            failedQueue = [];

            if (!isOnLoginPage) {
              store.dispatch(logout());
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
          });
      } else if (isRefreshing) {
        // Another request failed while refresh is in progress - queue it
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            // Retry original request after refresh completes
            if (originalRequest.headers) {
              const state = store.getState();
              const token = selectAccessToken(state);
              if (token) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      } else {
        // No refresh token available - logout
        if (apiError.message && apiError.message.trim().length > 0) {
          store.dispatch(addToast({
            message: apiError.message.trim(),
            type: 'error',
            duration: 6000,
          }));
        }

        if (!isOnLoginPage) {
          store.dispatch(logout());
          window.location.href = '/login';
        }
        return Promise.reject(apiError);
      }
    }

    // Show error toast for all other errors
    if (apiError.message && apiError.message.trim().length > 0) {
      store.dispatch(addToast({
        message: apiError.message.trim(),
        type: 'error',
        duration: 6000,
      }));
    }

    return Promise.reject(apiError);
  }
);

export default apiClient;

