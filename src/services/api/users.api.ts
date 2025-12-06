import { apolloClient } from './graphql/client';
import {
  GET_USERS_QUERY,
  BLOCK_USERS_MUTATION,
  UNBLOCK_USERS_MUTATION,
  TOP_UP_BALANCE_MUTATION,
  BULK_TOP_UP_BALANCE_MUTATION,
  GET_TOP_UP_TRANSACTIONS_QUERY,
} from './graphql/queries';

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
      const response = await apolloClient.query<{
        users: {
          users: AdminUser[];
          pagination: PaginationInfo;
        };
      }>({
        query: GET_USERS_QUERY,
        variables: {
          input: {
            role: role || undefined,
            query: query?.trim() || undefined,
            page: page || undefined,
            limit: limit || undefined,
          },
        },
        fetchPolicy: 'network-only',
      });
      
      if (response.data?.users?.users && Array.isArray(response.data.users.users)) {
        // Map _id to userId for consistency
        const mappedUsers = response.data.users.users.map(user => ({
          ...user,
          userId: user._id || user.userId,
        }));
        
        return {
          users: mappedUsers,
          pagination: response.data.users.pagination,
        };
      }
      
      throw new Error('Invalid API response format');
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Block multiple users (Admin only)
   * @param userIds - Array of user IDs to block
   */
  blockUsers: async (userIds: string[]): Promise<BlockUnblockResponse> => {
    const response = await apolloClient.mutate<{ blockUsers: BlockUnblockResponse }>({
      mutation: BLOCK_USERS_MUTATION,
      variables: {
        input: { userIds },
      },
    });
    return response.data?.blockUsers || { status: 200, success: true, message: '' };
  },

  /**
   * Unblock multiple users (Admin only)
   * @param userIds - Array of user IDs to unblock
   */
  unblockUsers: async (userIds: string[]): Promise<BlockUnblockResponse> => {
    const response = await apolloClient.mutate<{ unblockUsers: BlockUnblockResponse }>({
      mutation: UNBLOCK_USERS_MUTATION,
      variables: {
        input: { userIds },
      },
    });
    return response.data?.unblockUsers || { status: 200, success: true, message: '' };
  },

  /**
   * Top up user balance (Admin only)
   * @param userId - User ID to top up
   * @param amountGC - Amount to add to balance
   * @param description - Optional description for the top-up
   */
  topUpBalance: async (userId: string, amountGC: number, description?: string): Promise<TopUpResponse> => {
    const response = await apolloClient.mutate<{ topUpBalance: TopUpResponse }>({
      mutation: TOP_UP_BALANCE_MUTATION,
      variables: {
        input: {
          userId,
          amountGC,
          description: description || 'Top-up via Admin Panel',
        },
      },
    });
    return response.data?.topUpBalance || { status: 200, success: true, message: '' };
  },

  /**
   * Bulk top up user balance (Admin only)
   * @param userIds - Array of user IDs to top up
   * @param amountGC - Amount to add to balance for each user
   * @param description - Optional description for the top-up
   */
  topUpBalanceBulk: async (userIds: string[], amountGC: number, description?: string): Promise<BulkTopUpResponse> => {
    const response = await apolloClient.mutate<{ bulkTopUpBalance: BulkTopUpResponse }>({
      mutation: BULK_TOP_UP_BALANCE_MUTATION,
      variables: {
        input: {
          userIds,
          amountGC,
          description: description || 'Bulk top-up via Admin Panel',
        },
      },
    });
    return response.data?.bulkTopUpBalance || { status: 200, success: true, message: '' };
  },

  /**
   * Get top-up transactions (Admin only)
   * @param params - Query parameters for filtering transactions
   */
  getTopUpTransactions: async (params?: TopUpTransactionsParams): Promise<{ transactions: TopUpTransaction[]; total?: number }> => {
    try {
      const response = await apolloClient.query<{
        topUpTransactions: {
          transactions: TopUpTransaction[];
          total?: number;
        };
      }>({
        query: GET_TOP_UP_TRANSACTIONS_QUERY,
        variables: {
          input: {
            limit: params?.limit || undefined,
            skip: params?.skip || undefined,
            status: params?.status || undefined,
            userId: params?.userId || undefined,
            startDate: params?.startDate || undefined,
            endDate: params?.endDate || undefined,
          },
        },
        fetchPolicy: 'network-only',
      });
      
      if (response.data?.topUpTransactions?.transactions && Array.isArray(response.data.topUpTransactions.transactions)) {
        return {
          transactions: response.data.topUpTransactions.transactions,
          total: response.data.topUpTransactions.total,
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
};

