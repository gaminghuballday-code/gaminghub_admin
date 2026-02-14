import apiClient from './client';

// Admin Withdrawal Types
export interface WithdrawalRequest {
  _id: string;
  userId: string | {
    _id: string;
    email: string;
    name?: string;
    paymentUPI?: string;
  };
  amountGC: number;
  status: string; // 'pending', 'approved', 'rejected', etc.
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface WithdrawalsListResponse {
  status: number;
  success: boolean;
  message: string;
  data?: {
    withdrawals?: WithdrawalRequest[];
    withdrawalRequests?: WithdrawalRequest[];
    total?: number;
    limit?: number;
    skip?: number;
  };
}

export interface UpdateWithdrawalStatusRequest {
  status: 'approved' | 'rejected';
}

export interface UpdateWithdrawalStatusResponse {
  status: number;
  success: boolean;
  message: string;
  data?: {
    transactionId: string;
    status: string;
    amountGC?: number;
    userId?: string;
  };
}

export const withdrawalsApi = {
  /**
   * List withdrawal requests (Admin only)
   * GET /api/admin/withdrawals
   */
  getWithdrawals: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<WithdrawalsListResponse> => {
    const queryParams: Record<string, string> = {};

    if (params?.page) {
      queryParams.page = params.page.toString();
    }
    if (params?.limit) {
      queryParams.limit = params.limit.toString();
    }
    if (params?.status) {
      queryParams.status = params.status;
    }

    const response = await apiClient.get<WithdrawalsListResponse>(
      '/api/admin/withdrawals',
      { params: queryParams }
    );

    return response.data;
  },

  /**
   * Update withdrawal status (Admin only)
   * PATCH /api/admin/withdrawals/{transactionId}/status
   * @param transactionId - Transaction ID of the withdrawal request
   * @param data - Status update (approved | rejected)
   */
  updateWithdrawalStatus: async (
    transactionId: string,
    data: UpdateWithdrawalStatusRequest
  ): Promise<UpdateWithdrawalStatusResponse> => {
    const response = await apiClient.patch<UpdateWithdrawalStatusResponse>(
      `/api/admin/withdrawals/${transactionId}/status`,
      data
    );

    return response.data;
  },
};
