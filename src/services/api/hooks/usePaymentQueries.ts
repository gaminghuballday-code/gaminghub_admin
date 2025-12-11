import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentApi, type CreateOrderRequest, type VerifyPaymentRequest } from '../payment.api';
import { useAppDispatch } from '@store/hooks';
import { addToast } from '@store/slices/toastSlice';
import { walletKeys } from './useWalletQueries';

// Query keys
export const paymentKeys = {
  all: ['payment'] as const,
  status: (orderId: string) => [...paymentKeys.all, 'status', orderId] as const,
};

/**
 * Hook for creating payment order mutation
 */
export const useCreatePaymentOrder = () => {
  return useMutation({
    mutationFn: (data: CreateOrderRequest) => paymentApi.createOrder(data),
  });
};

/**
 * Hook for verifying payment mutation
 */
export const useVerifyPayment = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VerifyPaymentRequest) => paymentApi.verifyPayment(data),
    onSuccess: (response) => {
      // Invalidate and refetch wallet balance and history
      queryClient.invalidateQueries({ queryKey: walletKeys.balance() });
      queryClient.invalidateQueries({ queryKey: walletKeys.history() });
      
      // Show success message
      const message = response.message || 'Payment successful!';
      const amountGC = response.data?.amountGC || 0;
      dispatch(addToast({
        message: `${message} ${amountGC} GC added to your wallet.`,
        type: 'success',
        duration: 5000,
      }));
    },
    onError: (error: any) => {
      // Error toast is handled by API interceptor, but we can add specific message here if needed
      const errorMessage = error?.message || 'Payment verification failed. Please contact support.';
      dispatch(addToast({
        message: errorMessage,
        type: 'error',
        duration: 6000,
      }));
    },
  });
};

/**
 * Hook for fetching payment status
 * @param orderId - Razorpay order ID
 * @param enabled - Whether to enable the query
 */
export const usePaymentStatus = (orderId: string | null, enabled = true) => {
  return useQuery({
    queryKey: paymentKeys.status(orderId || ''),
    queryFn: () => paymentApi.getPaymentStatus(orderId!),
    enabled: enabled && !!orderId,
    refetchOnWindowFocus: false,
  });
};
