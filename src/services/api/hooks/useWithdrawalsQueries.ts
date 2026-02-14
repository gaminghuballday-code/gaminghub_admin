import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  withdrawalsApi,
  type UpdateWithdrawalStatusRequest,
} from '../withdrawals.api';
import { useAppDispatch } from '@store/hooks';
import { addToast } from '@store/slices/toastSlice';

// Query keys
export const withdrawalKeys = {
  all: ['withdrawals'] as const,
  list: (params?: string) =>
    [...withdrawalKeys.all, 'list', params || ''] as const,
};

/**
 * Hook for fetching withdrawal requests list (Admin only)
 */
export const useWithdrawalsList = (
  params?: { page?: number; limit?: number; status?: string },
  enabled = true
) => {
  return useQuery({
    queryKey: withdrawalKeys.list(JSON.stringify(params || {})),
    queryFn: () => withdrawalsApi.getWithdrawals(params),
    enabled,
    refetchOnWindowFocus: true,
    refetchInterval: 10000,
  });
};

/**
 * Hook for updating withdrawal status (Admin only) - Approve or Reject
 */
export const useUpdateWithdrawalStatus = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      transactionId,
      status,
    }: {
      transactionId: string;
      status: UpdateWithdrawalStatusRequest['status'];
    }) => withdrawalsApi.updateWithdrawalStatus(transactionId, { status }),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: withdrawalKeys.all });

      const action =
        variables.status === 'approved' ? 'approved' : 'rejected';
      const message =
        response.message || `Withdrawal ${action} successfully.`;
      dispatch(
        addToast({
          message,
          type: 'success',
          duration: 5000,
        })
      );
    },
    onError: (error: Error, variables) => {
      const action =
        variables.status === 'approved' ? 'approve' : 'reject';
      const errorMessage =
        error?.message ||
        `Failed to ${action} withdrawal. Please try again.`;
      dispatch(
        addToast({
          message: errorMessage,
          type: 'error',
          duration: 6000,
        })
      );
    },
  });
};
