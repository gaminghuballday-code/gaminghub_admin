import axios, { AxiosError } from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, CancelTokenSource } from 'axios';
import type { ApiError } from '../types/api.types';
import { store } from '../../store/store';
import { selectAccessToken, logout } from '../../store/slices/authSlice';
import { addToast } from '../../store/slices/toastSlice';

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
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token, deduplicate requests, and show loading
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const state = store.getState();
    const token = selectAccessToken(state);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
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
      const data = error.response.data as { message?: string; errors?: Record<string, string[]> };
      if (data.message) {
        apiError.message = data.message;
      }
      if (data.errors) {
        apiError.errors = data.errors;
      }
    }

    // Handle 401 Unauthorized - Clear token via Redux and redirect to login
    if (error.response?.status === 401) {
      const isOnLoginPage = window.location.pathname.includes('/login');
      
      // If on login page, show error toast for invalid credentials
      if (isOnLoginPage && apiError.message && apiError.message.trim().length > 0) {
        store.dispatch(addToast({
          message: apiError.message.trim(),
          type: 'error',
          duration: 6000,
        }));
      } else {
        // If not on login page, logout and redirect (don't show toast as redirecting)
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

