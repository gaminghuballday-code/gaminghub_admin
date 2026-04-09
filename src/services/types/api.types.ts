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

export interface VerifyLoginTwoFactorRequest {
  pendingToken: string;
  code: string;
}

/** Body for POST /api/auth/2fa/enable */
export interface TwoFactorEnableRequest {
  code: string;
}

/** Body for POST /api/auth/2fa/disable */
export interface TwoFactorDisableRequest {
  password: string;
  code: string;
}

export interface TwoFactorSetupResponse {
  qrCodeUrl?: string;
  qrCodeDataUrl?: string;
  otpauthUrl?: string;
  manualEntryKey?: string;
  secret?: string;
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
  email: string;
  otp: string;
  newPassword: string;
}

export interface GoogleLoginRequest {
  idToken: string;
  name?: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
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
  accessToken?: string;
  refreshToken?: string;
  user?: User;
  message?: string;
  requiresTwoFactor?: boolean;
  pendingToken?: string;
  email?: string;
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

// Support Ticket Types
export interface SupportTicket {
  _id: string;
  id?: string;
  ticketId?: string;
  userId?: string | {
    _id: string;
    email: string;
    name: string;
  };
  userEmail?: string;
  userName?: string;
  hostId?: string | {
    _id: string;
    email: string;
    name: string;
  };
  hostEmail?: string;
  hostName?: string;
  subject: string;
  description?: string;
  issue?: string; // API uses "issue" for description
  status: 'open' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  resolution?: string;
  notes?: string;
  attachments?: string[];
  messages?: Array<{
    _id: string;
    sender: 'user' | 'support';
    message: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  lastRepliedBy?: string;
  lastReplyAt?: string;
  tournamentId?: string | null;
}

export interface CreateTicketRequest {
  subject: string;
  issue: string; // API uses "issue" not "description"
  images?: string[];
}

export interface UpdateTicketRequest {
  status?: 'open' | 'closed';
  resolution?: string;
  notes?: string;
}

export interface TicketReplyRequest {
  message: string;
}

export interface TicketReplyResponse {
  status: number;
  success: boolean;
  message?: string;
  data?: {
    ticket?: SupportTicket;
  };
}

export interface TicketsListResponse {
  status: number;
  success: boolean;
  message?: string;
  data: {
    tickets?: SupportTicket[];
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

export interface TicketResponse {
  status: number;
  success: boolean;
  message?: string;
  data: {
    ticket?: SupportTicket;
  };
}

// FAQ Types
export interface FAQ {
  _id: string;
  id?: string;
  question: string;
  answer: string;
  category?: string;
  order?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FAQsListResponse {
  status: number;
  success: boolean;
  message?: string;
  data: {
    faqs?: FAQ[];
    total?: number;
  };
}// Dashboard & Analytics Types
export interface PlatformStats {
  totalUsers: number;
  totalIncome: number; // Total money in
  totalRewards: number; // Total money out (rewards/withdrawals)
  totalProfit: number;
  userGrowth: number; // Percentage
  incomeGrowth: number; // Percentage
  // Backward/forward-compatible keys seen in dashboard payloads
  totalDeposit?: number;
  totalTopupGC?: number;
  totalWithdraw?: number;
  totalWinDraw?: number;
  platformFeeCollected?: number;
  casterFeeCollected?: number;
  platformProfit?: number;
  netProfit?: number;
}

export interface AnalyticsDataPoint {
  period: string;
  platformFee: number;
  casterFee: number;
  totalIncome: number;
  totalDeposit: number;
  totalWithdraw: number;
  // Backward-compatible keys for older UI code
  date: string;
  deposits: number;
  withdrawals: number;
  profit: number;
  // Legacy chart keys still used in parts of dashboard
  income: number;
  rewards: number;
}

export interface AnalyticsTotals {
  platformFee: number;
  casterFee: number;
  totalIncome: number;
  totalDeposit: number;
  totalWithdraw: number;
}

export interface AnalyticsResponse {
  period: 'daily' | 'weekly' | 'monthly';
  data: AnalyticsDataPoint[];
  selectedPeriodTotals: AnalyticsTotals;
  overallTotals: AnalyticsTotals;
}

export interface PlatformStatsResponse {
  status: number;
  success: boolean;
  message?: string;
  data: PlatformStats;
}

