import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentApi, type CreateOrderRequest, type VerifyPaymentRequest, type CreateQRCodeRequest, type ConfirmPaymentRequest, type UpdatePaymentStatusRequest } from '../payment.api';
import { useAppDispatch } from '@store/hooks';
import { addToast } from '@store/slices/toastSlice';
import { walletKeys } from './useWalletQueries';

// Query keys
export const paymentKeys = {
  all: ['payment'] as const,
  status: (orderId: string) => [...paymentKeys.all, 'status', orderId] as const,
  qrStatus: (qrCodeId: string) => [...paymentKeys.all, 'qr-status', qrCodeId] as const,
  qrPayments: (qrCodeId: string) => [...paymentKeys.all, 'qr-payments', qrCodeId] as const,
  pendingPayments: () => [...paymentKeys.all, 'pending', 'admin'] as const,
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

/**
 * Hook for creating QR code payment
 */
export const useCreateQRCode = () => {
  const dispatch = useAppDispatch();
  
  return useMutation({
    mutationFn: (data: CreateQRCodeRequest) => paymentApi.createQRCode(data),
    onError: (error: any) => {
      const errorMessage = error?.message || 'Failed to create QR code. Please try again.';
      dispatch(addToast({
        message: errorMessage,
        type: 'error',
        duration: 6000,
      }));
    },
  });
};

/**
 * Hook for fetching QR code status (no polling - uses WebSocket for real-time updates)
 * @param qrCodeId - QR code ID
 * @param enabled - Whether to enable the query
 */
export const useQRCodeStatus = (qrCodeId: string | null, enabled = true) => {
  return useQuery({
    queryKey: paymentKeys.qrStatus(qrCodeId || ''),
    queryFn: () => paymentApi.getQRCodeStatus(qrCodeId!),
    enabled: enabled && !!qrCodeId,
    refetchInterval: false, // Disabled polling - using WebSocket for real-time updates
    refetchOnWindowFocus: true,
    retry: (failureCount, error: any) => {
      // Retry on network errors (5xx), but not on client errors (4xx)
      if (error?.status && error.status >= 400 && error.status < 500) {
        return false;
      }
      // Max 3 retries with exponential backoff
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};

/**
 * Hook for fetching payments for a QR code
 * @param qrCodeId - QR code ID
 * @param enabled - Whether to enable the query
 */
export const useQRCodePayments = (qrCodeId: string | null, enabled = true) => {
  return useQuery({
    queryKey: paymentKeys.qrPayments(qrCodeId || ''),
    queryFn: () => paymentApi.getQRCodePayments(qrCodeId!),
    enabled: enabled && !!qrCodeId,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook for closing a QR code
 */
export const useCloseQRCode = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (qrCodeId: string) => paymentApi.closeQRCode(qrCodeId),
    onSuccess: (_, qrCodeId) => {
      // Invalidate QR code queries
      queryClient.invalidateQueries({ queryKey: paymentKeys.qrStatus(qrCodeId) });
      queryClient.invalidateQueries({ queryKey: paymentKeys.qrPayments(qrCodeId) });
    },
  });
};

/**
 * Hook for confirming payment with UTR
 */
export const useConfirmPayment = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ConfirmPaymentRequest) => paymentApi.confirmPayment(data),
    onSuccess: (response, variables) => {
      // Invalidate QR code status to start polling
      queryClient.invalidateQueries({ queryKey: paymentKeys.qrStatus(variables.qrCodeId) });
      
      const message = response.message || 'Payment confirmation submitted. Verifying...';
      dispatch(addToast({
        message,
        type: 'info',
        duration: 5000,
      }));
    },
    onError: (error: any) => {
      let errorMessage = error?.message || 'Failed to confirm payment. Please try again.';
      
      // Handle specific error cases
      if (error?.message?.toLowerCase().includes('utr') || error?.message?.toLowerCase().includes('already used')) {
        errorMessage = 'This UTR has already been used. Please use a different UTR.';
      } else if (error?.message?.toLowerCase().includes('invalid') || error?.message?.toLowerCase().includes('format')) {
        errorMessage = 'Invalid UTR format. Please enter a valid UTR (8-20 characters).';
      }
      
      dispatch(addToast({
        message: errorMessage,
        type: 'error',
        duration: 6000,
      }));
    },
  });
};

/**
 * Hook for fetching pending payments (Admin only)
 */
export const usePendingPayments = (enabled = true) => {
  return useQuery({
    queryKey: paymentKeys.pendingPayments(),
    queryFn: () => paymentApi.getPendingPayments(),
    enabled,
    refetchOnWindowFocus: true,
    refetchInterval: 10000, // Poll every 10 seconds for new pending payments
  });
};

/**
 * Hook for updating payment status (Admin only) - Approve or Reject
 */
export const useUpdatePaymentStatus = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transactionId, status }: { transactionId: string; status: 'success' | 'fail' }) => {
      const requestData: UpdatePaymentStatusRequest = { status };
      return paymentApi.updatePaymentStatus(transactionId, requestData);
    },
    onSuccess: (response, variables) => {
      // Invalidate pending payments list
      queryClient.invalidateQueries({ queryKey: paymentKeys.pendingPayments() });
      
      const action = variables.status === 'success' ? 'approved' : 'rejected';
      const message = response.message || `Payment ${action} successfully.`;
      dispatch(addToast({
        message,
        type: 'success',
        duration: 5000,
      }));
    },
    onError: (error: any, variables) => {
      const action = variables.status === 'success' ? 'approve' : 'reject';
      const errorMessage = error?.message || `Failed to ${action} payment. Please try again.`;
      dispatch(addToast({
        message: errorMessage,
        type: 'error',
        duration: 6000,
      }));
    },
  });
};
