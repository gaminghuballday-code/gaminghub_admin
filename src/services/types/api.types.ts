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

export interface UpdateProfileRequest {
  name?: string;
  age?: number;
  gender?: string;
  ign?: string;
  paymentMethod?: string;
  phoneNumber?: string;
  paymentUPI?: string;
}

export interface CsrfTokenResponse {
  csrfToken: string;
  message?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
  message?: string;
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
  age?: number;
  gender?: string;
  ign?: string;
  paymentMethod?: string;
  phoneNumber?: string;
  paymentUPI?: string;
}

// Health Check Types
export interface HealthResponse {
  status: string;
  timestamp: string;
  uptime?: number;
}

// Inquiry Types
export interface InquiryRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface InquiryResponse {
  message: string;
  success?: boolean;
}

// Admin Enquiry Types
export interface Enquiry {
  _id: string;
  id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  replied?: boolean;
  replyMessage?: string;
  repliedAt?: string;
  repliedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface EnquiryReplyRequest {
  enquiryId: string;
  replyMessage: string;
}

export interface EnquiryReplyResponse {
  message: string;
  success?: boolean;
  data?: {
    enquiry: Enquiry;
  };
}

export interface EnquiriesListResponse {
  status: number;
  success: boolean;
  message?: string;
  data: {
    filters?: {
      status?: string | null;
      search?: string | null;
    };
    inquiries?: Enquiry[]; // API returns 'inquiries'
    enquiries?: Enquiry[]; // Fallback for backwards compatibility
    total?: number;
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

