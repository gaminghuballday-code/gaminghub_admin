import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  usersApi,
  // type AdminUser,
  type BlockUnblockRequest,
  type TopUpRequest,
  type BulkTopUpRequest,
  type TopUpTransactionsParams,
} from '../index';

// Query keys
export const usersKeys = {
  all: ['users'] as const,
  lists: () => [...usersKeys.all, 'list'] as const,
  list: (filters: { role?: string; query?: string; page?: number; limit?: number }) =>
    [...usersKeys.lists(), filters] as const,
  transactions: (params?: TopUpTransactionsParams) =>
    [...usersKeys.all, 'transactions', params] as const,
};

/**
 * Hook for fetching users list
 */
export const useUsers = (
  role?: string,
  query?: string,
  page?: number,
  limit?: number,
  enabled = true
) => {
  return useQuery({
    queryKey: usersKeys.list({ role, query, page, limit }),
    queryFn: () => usersApi.getUsers(role, query, page, limit),
    enabled,
  });
};

/**
 * Hook for blocking users mutation
 */
export const useBlockUsers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BlockUnblockRequest) => usersApi.blockUsers(data.userIds),
    onSuccess: () => {
      // Invalidate users list to refetch
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
};

/**
 * Hook for unblocking users mutation
 */
export const useUnblockUsers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BlockUnblockRequest) => usersApi.unblockUsers(data.userIds),
    onSuccess: () => {
      // Invalidate users list to refetch
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
};

/**
 * Hook for top-up balance mutation
 */
export const useTopUpBalance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TopUpRequest) => usersApi.topUpBalance(data.userId, data.amountGC, data.description),
    onSuccess: () => {
      // Invalidate users list and transactions
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });
};

/**
 * Hook for bulk top-up balance mutation
 */
export const useBulkTopUpBalance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkTopUpRequest) =>
      usersApi.topUpBalanceBulk(data.userIds, data.amountGC, data.description),
    onSuccess: () => {
      // Invalidate users list and transactions
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });
};

/**
 * Hook for fetching top-up transactions
 */
export const useTopUpTransactions = (params?: TopUpTransactionsParams, enabled = true) => {
  return useQuery({
    queryKey: usersKeys.transactions(params),
    queryFn: () => usersApi.getTopUpTransactions(params),
    enabled,
  });
};

