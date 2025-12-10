import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { walletApi, type UserTopUpRequest, type WalletHistoryParams } from '../wallet.api';
import { useAppDispatch } from '@store/hooks';
import { addToast } from '@store/slices/toastSlice';

// Query keys
export const walletKeys = {
  all: ['wallet'] as const,
  balance: () => [...walletKeys.all, 'balance'] as const,
  history: () => [...walletKeys.all, 'history'] as const,
  walletHistory: (params?: WalletHistoryParams) => [...walletKeys.all, 'wallet-history', params] as const,
};

/**
 * Hook for fetching wallet balance
 */
export const useWalletBalance = (enabled = true) => {
  return useQuery({
    queryKey: walletKeys.balance(),
    queryFn: async () => {
      const response = await walletApi.getBalance();
      return response.data?.balanceGC ?? 0;
    },
    enabled,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook for fetching top-up history
 */
export const useTopUpHistory = (enabled = true) => {
  return useQuery({
    queryKey: walletKeys.history(),
    queryFn: async () => {
      const response = await walletApi.getTopUpHistory();
      return response.data?.history ?? [];
    },
    enabled,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook for top-up wallet mutation
 */
export const useTopUpWallet = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserTopUpRequest) => walletApi.topUp(data),
    onSuccess: (response) => {
      // Invalidate and refetch balance and history
      queryClient.invalidateQueries({ queryKey: walletKeys.balance() });
      queryClient.invalidateQueries({ queryKey: walletKeys.history() });
      
      // Show success message with pending approval info
      const message = response.message || 'Top-up request submitted successfully!';
      dispatch(addToast({
        message: `${message} Waiting for admin approval.`,
        type: 'success',
        duration: 5000,
      }));
    },
  });
};

/**
 * Hook for fetching wallet history (tournament winnings and transactions)
 */
export const useWalletHistory = (params?: WalletHistoryParams, enabled = true) => {
  return useQuery({
    queryKey: walletKeys.walletHistory(params),
    queryFn: async () => {
      const response = await walletApi.getWalletHistory(params);
      return response.data?.history ?? [];
    },
    enabled,
    refetchOnWindowFocus: false,
  });
};

