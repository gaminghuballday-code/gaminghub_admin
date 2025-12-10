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
};

