import axios, { AxiosError } from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, CancelTokenSource } from 'axios';
import type { ApiError } from '../types/api.types';
import { store } from '../../store/store';
import { selectAccessToken, logout } from '../../store/slices/authSlice';
import { addToast } from '../../store/slices/toastSlice';
import { STORAGE_KEYS } from '../../utils/constants';

// Use relative URLs to leverage proxy (Vite in dev, Vercel in production)
// This avoids CORS issues by making requests from the same origin
// Override with VITE_API_BASE_URL if you need direct API calls
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 10000;

// Request deduplication - prevent duplicate requests
const pendingRequests = new Map<string, CancelTokenSource>();

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

    // Handle 401 Unauthorized - show toast, clear token and redirect to login (if not already there)
    if (error.response?.status === 401) {
      const isOnLoginPage = window.location.pathname.includes('/login');

      // Always show an error toast if we have a meaningful message
      if (apiError.message && apiError.message.trim().length > 0) {
        store.dispatch(addToast({
          message: apiError.message.trim(),
          type: 'error',
          duration: 6000,
        }));
      }

      // If not already on login page, logout and redirect
      if (!isOnLoginPage) {
        store.dispatch(logout());
        window.location.href = '/login';
      }
      return Promise.reject(apiError);
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

