// API Response Types
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success?: boolean;
}

export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface GoogleLoginRequest {
  idToken: string;
  name?: string;
}

export interface CsrfTokenResponse {
  csrfToken: string;
  message?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export interface User {
  userId: string;
  email: string;
  name?: string;
  role?: string;
  isEmailVerified?: boolean;
  balanceGC?: number;
  isBlocked?: boolean;
  _id?: string;
  createdAt?: string;
}

// Health Check Types
export interface HealthResponse {
  status: string;
  timestamp: string;
  uptime?: number;
}

