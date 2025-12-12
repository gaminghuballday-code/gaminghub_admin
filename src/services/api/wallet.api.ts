import apiClient from './client';

// Wallet API Types
export interface WalletBalanceResponse {
  status: number;
  success: boolean;
  message: string;
  data?: {
    balanceGC: number;
  };
}

export interface TopUpHistoryItem {
  _id: string;
  userId: string;
  amountGC: number;
  type: 'topup' | 'deduction' | 'refund';
  status: 'pending' | 'completed' | 'failed' | 'fail';
  description?: string;
  createdAt: string;
  updatedAt: string;
  addedBy?: string;
  timestamp?: string;
  tournamentId?: string | null;
  __v?: number;
}

export interface TopUpHistoryResponse {
  status: number;
  success: boolean;
  message: string;
  data?: {
    history: TopUpHistoryItem[];
    total?: number;
    limit?: number;
    skip?: number;
  };
}

export interface UserTopUpRequest {
  amountGC: number;
  description?: string;
}

export interface UserTopUpResponse {
  status: number;
  success: boolean;
  message: string;
  data?: {
    balanceGC: number;
    transaction?: TopUpHistoryItem;
  };
}

export interface WalletHistoryItem {
  _id: string;
  tournamentId?: string;
  tournament?: {
    _id: string;
    game: string;
    mode: string;
    subMode: string;
    date: string;
    startTime: string;
    prizePool: number;
  };
  winnings?: number;
  rank?: number;
  date?: string;
  time?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletHistoryParams {
  limit?: number;
  skip?: number;
}

export interface WalletHistoryResponse {
  status: number;
  success: boolean;
  message: string;
  data?: {
    history: WalletHistoryItem[];
    total?: number;
    limit?: number;
    skip?: number;
  };
}

export interface UserWithdrawRequest {
  amountGC: number;
  description?: string;
}

export interface UserWithdrawResponse {
  status: number;
  success: boolean;
  message: string;
  data?: {
    balanceGC: number;
    transaction?: TopUpHistoryItem;
  };
}

export const walletApi = {
  /**
   * Get wallet balance for current user
   */
  getBalance: async (): Promise<WalletBalanceResponse> => {
    const response = await apiClient.get<WalletBalanceResponse>('/api/wallet/balance');
    return response.data;
  },

  /**
   * Get top-up history for current user
   */
  getTopUpHistory: async (): Promise<TopUpHistoryResponse> => {
    const response = await apiClient.get<TopUpHistoryResponse>('/api/wallet/topup-history');
    return response.data;
  },

  /**
   * Top-up wallet (User self top-up)
   */
  topUp: async (data: UserTopUpRequest): Promise<UserTopUpResponse> => {
    const response = await apiClient.post<UserTopUpResponse>('/api/wallet/topup', data);
    return response.data;
  },

  /**
   * Get wallet history (tournament winnings and transactions)
   * @param params - Query parameters (limit, skip)
   */
  getWalletHistory: async (params?: WalletHistoryParams): Promise<WalletHistoryResponse> => {
    const queryParams: Record<string, string> = {};
    
    if (params?.limit !== undefined) {
      queryParams.limit = params.limit.toString();
    }
    
    if (params?.skip !== undefined) {
      queryParams.skip = params.skip.toString();
    }
    
    const response = await apiClient.get<WalletHistoryResponse>('/api/wallet/history', {
      params: queryParams,
    });
    return response.data;
  },

  /**
   * Withdraw from wallet (User self withdraw)
   */
  withdraw: async (data: UserWithdrawRequest): Promise<UserWithdrawResponse> => {
    const response = await apiClient.post<UserWithdrawResponse>('/api/wallet/withdraw', data);
    return response.data;
  },
};

