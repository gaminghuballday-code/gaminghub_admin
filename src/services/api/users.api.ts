import apiClient from './client';

export interface AdminUser {
  _id?: string;
  userId?: string;
  email: string;
  name?: string;
  role?: string;
  isEmailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  authProvider?: string;
  isBlocked?: boolean;
  roomIds?: string[];
  balanceGC?: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UsersListResponse {
  status: number;
  success: boolean;
  message: string;
  data: {
    users: AdminUser[];
    pagination: PaginationInfo;
  };
}

export interface BlockUnblockRequest {
  userIds: string[];
}

export interface BlockUnblockResponse {
  status: number;
  success: boolean;
  message: string;
  data?: {
    blocked?: string[];
    unblocked?: string[];
  };
}

export interface TopUpRequest {
  userId: string;
  amountGC: number;
  description?: string;
}

export interface TopUpResponse {
  status: number;
  success: boolean;
  message: string;
  data?: {
    balanceGC: number;
  };
}

export interface BulkTopUpRequest {
  userIds: string[];
  amountGC: number;
  description?: string;
}

export interface BulkTopUpResponse {
  status: number;
  success: boolean;
  message: string;
  data?: {
    successCount?: number;
    failedCount?: number;
    results?: Array<{
      userId: string;
      success: boolean;
      balanceGC?: number;
      error?: string;
    }>;
  };
}

export interface TopUpTransaction {
  _id?: string;
  userId: string;
  amountGC: number;
  status: 'success' | 'fail';
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TopUpTransactionsResponse {
  status: number;
  success: boolean;
  message: string;
  data?: {
    transactions: TopUpTransaction[];
    total?: number;
  };
}

export interface TopUpTransactionsParams {
  limit?: number;
  skip?: number;
  status?: 'success' | 'fail';
  userId?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

export interface GetUserReferralsParams {
  userId?: string;
  email?: string;
  limit?: number;
  skip?: number;
}

export interface UserReferralsStats {
  referralCount: number;
  grcCoin: number;
}

interface UserReferralsResponse {
  status: number;
  success: boolean;
  message: string;
  data?: unknown;
}

const parseFiniteNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (Number.isFinite(n)) {
      return n;
    }
  }
  return undefined;
};

const normalizeUserReferralsStats = (raw: unknown): UserReferralsStats => {
  if (!raw || typeof raw !== 'object') {
    return { referralCount: 0, grcCoin: 0 };
  }

  const o = raw as Record<string, unknown>;
  const meta =
    o.meta && typeof o.meta === 'object' ? (o.meta as Record<string, unknown>) : undefined;
  const summary =
    o.summary && typeof o.summary === 'object' ? (o.summary as Record<string, unknown>) : undefined;

  const referralCount =
    parseFiniteNumber(o.referralCount) ??
    parseFiniteNumber(o.referralsCount) ??
    parseFiniteNumber(o.totalReferrals) ??
    parseFiniteNumber(o.count) ??
    parseFiniteNumber(meta?.total) ??
    parseFiniteNumber(meta?.totalReferrals) ??
    parseFiniteNumber(summary?.referralCount) ??
    parseFiniteNumber(summary?.totalReferrals) ??
    (Array.isArray(o.referrals) ? o.referrals.length : undefined) ??
    0;

  const grcCoin =
    parseFiniteNumber(o.grcCoin) ??
    parseFiniteNumber(o.grcCoins) ??
    parseFiniteNumber(o.totalGrcCoin) ??
    parseFiniteNumber(o.totalGrcCoins) ??
    parseFiniteNumber(o.totalGC) ??
    parseFiniteNumber(o.totalGc) ??
    parseFiniteNumber(o.totalRewardGc) ??
    parseFiniteNumber(summary?.grcCoin) ??
    parseFiniteNumber(summary?.totalGrcCoin) ??
    parseFiniteNumber(summary?.totalGrcCoins) ??
    0;

  return {
    referralCount,
    grcCoin,
  };
};

export const usersApi = {
  /**
   * Get admin users with optional role filter and search query
   * @param role - Filter by role (e.g., 'admin')
   * @param query - Search query for name or email
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 10)
   */
  getUsers: async (role?: string, query?: string, page?: number, limit?: number): Promise<{ users: AdminUser[]; pagination?: PaginationInfo }> => {
    try {
      const params: Record<string, string> = {};
      if (role) {
        params.role = role;
      }
      if (query && query.trim()) {
        const q = query.trim();
        params.query = q;
        params.search = q;
      }
      if (page) {
        params.page = page.toString();
      }
      if (limit) {
        params.limit = limit.toString();
      }
      const response = await apiClient.get<UsersListResponse>('/api/admin/users', { params });
      
      // Expected format: { status, success, message, data: { users: [...], pagination: {...} } }
      if (response.data?.data?.users && Array.isArray(response.data.data.users)) {
        // Map _id to userId for consistency
        const mappedUsers = response.data.data.users.map(user => ({
          ...user,
          userId: user._id || user.userId,
        }));
        
        return {
          users: mappedUsers,
          pagination: response.data.data.pagination,
        };
      }
      
      // If format is wrong, throw error
      throw new Error('Invalid API response format. Expected: { data: { users: [...], pagination: {...} } }');
    } catch (error: any) {
      // If it's our custom error, throw it
      if (error.message && error.message.includes('Invalid API response format')) {
        throw error;
      }
      
      // Otherwise, rethrow the original error
      throw error;
    }
  },

  /**
   * Delete a user by id (Admin only; privileged when allowlist is configured on server)
   */
  deleteUser: async (userId: string): Promise<void> => {
    await apiClient.delete(`/api/admin/users/${encodeURIComponent(userId)}`);
  },

  /**
   * Block multiple users (Admin only)
   * @param userIds - Array of user IDs to block
   */
  blockUsers: async (userIds: string[]): Promise<BlockUnblockResponse> => {
    const response = await apiClient.post<BlockUnblockResponse>('/api/admin/users/block', {
      userIds,
    });
    return response.data;
  },

  /**
   * Unblock multiple users (Admin only)
   * @param userIds - Array of user IDs to unblock
   */
  unblockUsers: async (userIds: string[]): Promise<BlockUnblockResponse> => {
    const response = await apiClient.post<BlockUnblockResponse>('/api/admin/users/unblock', {
      userIds,
    });
    return response.data;
  },

  /**
   * Top up user balance (Admin only)
   * @param userId - User ID to top up
   * @param amountGC - Amount to add to balance
   * @param description - Optional description for the top-up
   */
  topUpBalance: async (userId: string, amountGC: number, description?: string): Promise<TopUpResponse> => {
    const response = await apiClient.post<TopUpResponse>('/api/wallet/add-balance', {
      userId,
      amountGC,
      description: description || 'Top-up via Admin Panel',
    });
    return response.data;
  },

  /**
   * Bulk top up user balance (Admin only)
   * @param userIds - Array of user IDs to top up
   * @param amountGC - Amount to add to balance for each user
   * @param description - Optional description for the top-up
   */
  topUpBalanceBulk: async (userIds: string[], amountGC: number, description?: string): Promise<BulkTopUpResponse> => {
    const response = await apiClient.post<BulkTopUpResponse>('/api/wallet/add-balance-bulk', {
      userIds,
      amountGC,
      description: description || 'Bulk top-up via Admin Panel',
    });
    return response.data;
  },

  /**
   * Get top-up transactions (Admin only)
   * @param params - Query parameters for filtering transactions
   */
  getTopUpTransactions: async (params?: TopUpTransactionsParams): Promise<{ transactions: TopUpTransaction[]; total?: number }> => {
    try {
      const queryParams: Record<string, string> = {};
      if (params?.limit) {
        queryParams.limit = params.limit.toString();
      }
      if (params?.skip) {
        queryParams.skip = params.skip.toString();
      }
      if (params?.status) {
        queryParams.status = params.status;
      }
      if (params?.userId) {
        queryParams.userId = params.userId;
      }
      if (params?.startDate) {
        queryParams.startDate = params.startDate;
      }
      if (params?.endDate) {
        queryParams.endDate = params.endDate;
      }

      const response = await apiClient.get<TopUpTransactionsResponse>('/api/admin/topup-transactions', { params: queryParams });
      
      if (response.data?.data?.transactions && Array.isArray(response.data.data.transactions)) {
        return {
          transactions: response.data.data.transactions,
          total: response.data.data.total,
        };
      }
      
      return {
        transactions: [],
        total: 0,
      };
    } catch (error: any) {
      console.error('Failed to get top-up transactions:', error);
      throw error;
    }
  },

  /**
   * Get referral stats for a specific user by userId or email (Admin only).
   */
  getUserReferralsStats: async (params: GetUserReferralsParams): Promise<UserReferralsStats> => {
    const queryParams: Record<string, string> = {};
    const userId = params.userId?.trim();
    const email = params.email?.trim();

    if (userId) {
      queryParams.userId = userId;
    } else if (email) {
      queryParams.email = email;
    } else {
      return { referralCount: 0, grcCoin: 0 };
    }

    const limit = params.limit ?? 100;
    const skip = params.skip ?? 0;
    queryParams.limit = String(limit);
    queryParams.skip = String(skip);

    const response = await apiClient.get<UserReferralsResponse>('/api/admin/users/referrals', {
      params: queryParams,
    });
    return normalizeUserReferralsStats(response.data?.data);
  },
};

