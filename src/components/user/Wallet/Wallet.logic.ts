import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import { selectUser } from '@store/slices/authSlice';
import { addToast } from '@store/slices/toastSlice';
import { useQueryClient } from '@tanstack/react-query';
import {
  useWalletBalance,
  useTopUpHistory,
  useWithdrawWallet,
} from '@services/api/hooks/useWalletQueries';
import {
  useCreateQRCode,
  useQRCodeStatus,
  useCloseQRCode,
  useConfirmPayment,
} from '@services/api/hooks/usePaymentQueries';
import { useWalletWebSocket } from '@hooks/useWalletWebSocket';
import { getSocket } from '@services/websocket/socket';
import { paymentKeys } from '@services/api/hooks/usePaymentQueries';
import type { QRCodeStatusResponse } from '@services/api/payment.api';
import type { UseWalletLogicReturn } from './Wallet.types';

interface TransactionData {
  description?: string;
  transactionId?: string;
  paymentId?: string;
  amountINR?: number;
  amountGC?: number;
  type?: string;
  status?: string;
}

export interface QRPaymentState {
  qrCodeId: string | null;
  qrCodeImage: string | null;
  qrAmount: number;
  paymentStep: 'qr' | 'payment' | 'submitted';
  utr: string;
  utrError: string;
  qrExpiresAt: Date | null;
  timeRemaining: number;
  currentPaymentId: string | null;
  qrStatusFromSocket: QRCodeStatusResponse['data'] | null;
}

export const useWalletLogic = () => {
  const {
    data: balance,
    isLoading: balanceLoading,
    refetch: refetchBalance,
  } = useWalletBalance();
  
  const [historyPage, setHistoryPage] = useState(1);
  const { data: historyData, isLoading: historyLoading } = useTopUpHistory(historyPage);
  const history = historyData?.history ?? [];
  const pagination = historyData?.pagination;
  
  const withdrawWalletMutation = useWithdrawWallet();
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  // Top-up form state
  const [topUpAmount, setTopUpAmount] = useState('');
  const [showTopUpForm, setShowTopUpForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [amountError, setAmountError] = useState('');

  // QR Payment state
  const [qrPaymentState, setQrPaymentState] = useState<QRPaymentState>({
    qrCodeId: null,
    qrCodeImage: null,
    qrAmount: 0,
    paymentStep: 'qr',
    utr: '',
    utrError: '',
    qrExpiresAt: null,
    timeRemaining: 0,
    currentPaymentId: null,
    qrStatusFromSocket: null,
  });

  // Withdraw modal state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawError, setWithdrawError] = useState('');

  // QR Payment Modal state
  const [showQRPaymentModal, setShowQRPaymentModal] = useState(false);

  // Refs to avoid stale closures in callbacks
  const qrPaymentStateRef = useRef(qrPaymentState);
  const resetQRCodePaymentRef = useRef<(() => void) | undefined>(undefined);

  // Keep refs in sync with state
  useEffect(() => {
    qrPaymentStateRef.current = qrPaymentState;
    
    // Auto-open modal when QR code data is ready and modal is not already open
    if (
      qrPaymentState.qrCodeId &&
      qrPaymentState.qrCodeImage &&
      qrPaymentState.paymentStep === 'payment' &&
      !showQRPaymentModal
    ) {
      setShowQRPaymentModal(true);
    }
  }, [qrPaymentState, showQRPaymentModal]);

  // Mutations
  const createQRCodeMutation = useCreateQRCode();
  const confirmPaymentMutation = useConfirmPayment();
  const closeQRCodeMutation = useCloseQRCode();

  // QR Status query
  const qrStatusQuery = useQRCodeStatus(
    qrPaymentState.qrCodeId,
    !!qrPaymentState.qrCodeId &&
      qrPaymentState.paymentStep !== 'qr' &&
      qrPaymentState.paymentStep !== 'submitted' &&
      !qrPaymentState.currentPaymentId
  );

  // Get QR status: WebSocket update > Query data
  const qrStatus = qrPaymentState.qrStatusFromSocket || qrStatusQuery.data?.data;

  // Helper functions to update QR payment state
  const updateQrPaymentState = (updates: Partial<QRPaymentState>) => {
    setQrPaymentState((prev) => ({ ...prev, ...updates }));
  };

  const resetQRCodePayment = useCallback(() => {
    setQrPaymentState({
      qrCodeId: null,
      qrCodeImage: null,
      qrAmount: 0,
      paymentStep: 'qr',
      utr: '',
      utrError: '',
      qrExpiresAt: null,
      timeRemaining: 0,
      currentPaymentId: null,
      qrStatusFromSocket: null,
    });
    setTopUpAmount('');
    setAmountError('');
    setShowQRPaymentModal(false);
  }, []);

  // Store resetQRCodePayment in ref for use in effects
  useEffect(() => {
    resetQRCodePaymentRef.current = resetQRCodePayment;
  }, [resetQRCodePayment]);

  // WebSocket subscription for real-time wallet updates
  useWalletWebSocket({
    enabled: !!(user?._id || user?.userId),
    onBalanceUpdate: () => {
      // Balance will be automatically refetched via query invalidation
    },
    onTransactionUpdate: (data: TransactionData) => {
      // Handle QR payment status updates from admin approval/rejection
      if (
        qrPaymentState.qrCodeId &&
        qrPaymentState.paymentStep === 'submitted'
      ) {
        const description = data.description || '';
        const matchesByQRCode = description.includes(qrPaymentState.qrCodeId);
          const matchesByPaymentId =
          qrPaymentState.currentPaymentId &&
          (data.transactionId === qrPaymentState.currentPaymentId ||
            data.paymentId === qrPaymentState.currentPaymentId);
        const matchesByAmount =
          data.type === 'topup' &&
          data.amountINR !== undefined &&
          Math.abs(data.amountINR - qrPaymentState.qrAmount) < 0.01;

        if (matchesByQRCode || matchesByPaymentId || matchesByAmount) {
          // Update currentPaymentId if we got it from the event
          if (data.transactionId && !qrPaymentState.currentPaymentId) {
            updateQrPaymentState({ currentPaymentId: data.transactionId });
          }

          // Directly update QR status from WebSocket data
          const newStatus: QRCodeStatusResponse = {
            status: 200,
            success: true,
            message:
              data.status === 'success'
                ? 'Payment verified successfully'
                : data.status === 'fail'
                ? 'Payment verification failed'
                : 'Payment verification pending',
            data: {
              qrCodeId: qrPaymentState.qrCodeId,
              status:
                data.status === 'success'
                  ? 'paid'
                  : data.status === 'fail'
                  ? 'failed'
                  : 'pending',
              amountINR: data.amountINR ?? qrPaymentState.qrAmount,
              amountGC: data.amountGC ?? 0,
              paymentId:
                qrPaymentState.currentPaymentId ||
                data.paymentId ||
                data.transactionId ||
                undefined,
              paidAt:
                data.status === 'success'
                  ? new Date().toISOString()
                  : undefined,
            },
          };

          // Update React Query cache and local state
          queryClient.setQueryData<QRCodeStatusResponse>(
            paymentKeys.qrStatus(qrPaymentState.qrCodeId),
            newStatus
          );
          updateQrPaymentState({ qrStatusFromSocket: newStatus.data || null });
        }
      }
    },
    onHistoryUpdate: () => {
      // History will be automatically refetched via query invalidation
    },
  });

  // Calculate expiration countdown
  useEffect(() => {
    if (!qrPaymentState.qrExpiresAt || qrPaymentState.paymentStep === 'submitted') {
      updateQrPaymentState({ timeRemaining: 0 });
      return;
    }

    const interval = setInterval(() => {
      // Use ref to get current values (fixes stale closure bug)
      const currentState = qrPaymentStateRef.current;
      
      if (!currentState.qrExpiresAt || currentState.paymentStep === 'submitted') {
        clearInterval(interval);
        return;
      }

      const now = new Date().getTime();
      const expires = currentState.qrExpiresAt.getTime();
      const remaining = Math.max(0, Math.floor((expires - now) / 1000));

      updateQrPaymentState({ timeRemaining: remaining });

      if (remaining === 0) {
        // QR expired - use current values from ref
        if (currentState.qrCodeId) {
          closeQRCodeMutation.mutate(currentState.qrCodeId);
        }
        if (resetQRCodePaymentRef.current) {
          resetQRCodePaymentRef.current();
        }
        dispatch(
          addToast({
            message: 'QR code expired. Please create a new one.',
            type: 'warning',
            duration: 5000,
          })
        );
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [qrPaymentState.qrExpiresAt, qrPaymentState.paymentStep, qrPaymentState.qrCodeId, closeQRCodeMutation, dispatch, resetQRCodePayment]);

  // WebSocket listener for QR code status updates
  useEffect(() => {
    const currentQrCodeId = qrPaymentState.qrCodeId;
    if (!currentQrCodeId) {
      return;
    }

    const socket = getSocket();
    if (!socket) {
      return;
    }

    const subscribe = () => {
      socket.emit('subscribe:qr', currentQrCodeId);
    };

    if (socket.connected) {
      subscribe();
    } else {
      socket.once('connect', subscribe);
    }

    const handleQRStatusUpdate = (payload: {
      qrCodeId: string;
      status: QRCodeStatusResponse;
    }) => {
      // Use ref to get current value (fixes stale closure bug)
      const currentState = qrPaymentStateRef.current;
      if (payload.qrCodeId !== currentState.qrCodeId) {
        return;
      }

      queryClient.setQueryData<QRCodeStatusResponse>(
        paymentKeys.qrStatus(currentState.qrCodeId),
        payload.status
      );
      updateQrPaymentState({ qrStatusFromSocket: payload.status.data || null });
    };

    socket.on('payment:qr-status-updated', handleQRStatusUpdate);

    return () => {
      if (socket) {
        socket.off('payment:qr-status-updated', handleQRStatusUpdate);
        socket.emit('unsubscribe:qr', currentQrCodeId);
      }
    };
  }, [qrPaymentState.qrCodeId, queryClient]);

  // Store paymentId from QR status for WebSocket matching
  useEffect(() => {
    if (qrStatus?.paymentId && !qrPaymentState.currentPaymentId) {
      updateQrPaymentState({ currentPaymentId: qrStatus.paymentId });
    }
  }, [qrStatus?.paymentId, qrPaymentState.currentPaymentId]);

  // Handle QR status changes - refresh balance when payment is verified
  useEffect(() => {
    if (
      !qrPaymentState.qrCodeId ||
      !qrStatus ||
      qrPaymentState.paymentStep === 'qr' ||
      qrPaymentState.paymentStep === 'payment'
    ) {
      return;
    }

    const status = qrStatus.status;

    if (status === 'paid' || status === 'success') {
      refetchBalance();
    } else if (status === 'failed') {
      dispatch(
        addToast({
          message: 'Payment verification failed. Please try again.',
          type: 'error',
          duration: 6000,
        })
      );
    } else if (status === 'expired' || status === 'closed') {
      dispatch(
        addToast({
          message: 'QR code expired or closed. Please create a new one.',
          type: 'warning',
          duration: 5000,
        })
      );
    }
  }, [
    qrStatus?.status,
    qrPaymentState.qrCodeId,
    qrPaymentState.paymentStep,
    dispatch,
    refetchBalance,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Use ref to get current value (fixes stale closure bug)
      const currentState = qrPaymentStateRef.current;
      if (currentState.qrCodeId) {
        closeQRCodeMutation.mutate(currentState.qrCodeId);
      }
    };
  }, [closeQRCodeMutation]);

  // Validation functions
  const validateUTR = (value: string): boolean => {
    const trimmed = value.trim();
    return (
      trimmed.length >= 8 &&
      trimmed.length <= 20 &&
      /^[A-Za-z0-9]+$/.test(trimmed)
    );
  };

  // Handlers
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value.replace(/[^0-9]/g, '');

    if (value !== numericValue) {
      setAmountError('Only numbers are allowed');
    } else {
      setAmountError('');
    }

    setTopUpAmount(numericValue);
  };

  const handleQRCodePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (qrPaymentState.qrCodeId && qrPaymentState.paymentStep !== 'qr') {
      dispatch(
        addToast({
          message:
            'Please complete or cancel the current payment before starting a new one.',
          type: 'warning',
          duration: 5000,
        })
      );
      return;
    }

    const amountINR = parseFloat(topUpAmount);

    if (isNaN(amountINR) || amountINR < 1) {
      setAmountError('Minimum top-up amount is ₹1');
      return;
    }

    setAmountError('');
    setIsProcessing(true);

    try {
      const result = await createQRCodeMutation.mutateAsync({
        amountINR: amountINR,
      });

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to create QR code');
      }

      // Validate required data
      if (!result.data.qrCodeId || !result.data.qrCodeImage) {
        throw new Error('QR code data is incomplete. Please try again.');
      }

      // Set QR code data and move to payment step
      // Calculate expiration time first
      const qrExpiresAt = result.data.expiresAt 
        ? new Date(result.data.expiresAt)
        : (() => {
            const expires = new Date();
            expires.setMinutes(expires.getMinutes() + 10);
            return expires;
          })();

      // Update all state in a single call to avoid race conditions
      updateQrPaymentState({
        qrCodeImage: result.data.qrCodeImage,
        qrCodeId: result.data.qrCodeId,
        qrAmount: amountINR,
        paymentStep: 'payment',
        qrExpiresAt: qrExpiresAt,
      });
      
      // Open modal after state update - use setTimeout to ensure state has propagated
      setTimeout(() => {
        setShowQRPaymentModal(true);
      }, 0);

      dispatch(
        addToast({
          message: 'QR code generated! Scan with your UPI app to pay.',
          type: 'success',
          duration: 4000,
        })
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create QR code. Please try again.';
      dispatch(
        addToast({
          message: errorMessage,
          type: 'error',
          duration: 6000,
        })
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUTRChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim().toUpperCase();
    updateQrPaymentState({ utr: value });

    if (value.length > 0 && !validateUTR(value)) {
      updateQrPaymentState({ utrError: 'UTR must be 8-20 alphanumeric characters' });
    } else {
      updateQrPaymentState({ utrError: '' });
    }
  };

  const handleUTRSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!qrPaymentState.qrCodeId) {
      dispatch(
        addToast({
          message: 'QR code not found. Please generate a new QR code.',
          type: 'error',
          duration: 5000,
        })
      );
      return;
    }

    const trimmedUtr = qrPaymentState.utr.trim();

    if (!trimmedUtr) {
      updateQrPaymentState({ utrError: 'Please enter UTR' });
      return;
    }

    if (!validateUTR(trimmedUtr)) {
      updateQrPaymentState({ utrError: 'UTR must be 8-20 alphanumeric characters' });
      return;
    }

    updateQrPaymentState({ utrError: '' });

    try {
      await confirmPaymentMutation.mutateAsync({
        qrCodeId: qrPaymentState.qrCodeId,
        utr: trimmedUtr,
      });

      updateQrPaymentState({ paymentStep: 'submitted' });
    } catch (error: unknown) {
      // Error handling is done in the hook
    }
  };

  const handleWithdrawClick = () => {
    if (!user?.paymentUPI) {
      dispatch(
        addToast({
          message:
            'Please update your Payment UPI in your profile before withdrawing.',
          type: 'warning',
          duration: 6000,
        })
      );
      return;
    }

    setWithdrawAmount('');
    setWithdrawError('');
    setShowWithdrawModal(true);
  };

  const handleWithdrawAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    const numericValue = value.replace(/[^0-9]/g, '');

    if (value !== numericValue) {
      setWithdrawError('Only numbers are allowed');
    } else {
      setWithdrawError('');
    }

    setWithdrawAmount(numericValue);
  };

  const handleMaxWithdrawClick = () => {
    if (balance && balance > 0) {
      setWithdrawAmount(balance.toString());
      setWithdrawError('');
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountGC = parseFloat(withdrawAmount);

    if (isNaN(amountGC) || amountGC <= 0) {
      setWithdrawError('Please enter a valid amount');
      return;
    }

    if (!balance || amountGC > balance) {
      setWithdrawError('Insufficient balance');
      return;
    }

    setWithdrawError('');

    try {
      await withdrawWalletMutation.mutateAsync({
        amountGC: amountGC,
        description: 'Withdraw request',
      });

      setShowWithdrawModal(false);
      setWithdrawAmount('');
      refetchBalance();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process withdraw request';
      setWithdrawError(errorMessage);
    }
  };

  const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const maskPaymentId = (paymentId: string): string => {
    if (paymentId.length <= 8) {
      return paymentId;
    }
    const firstPart = paymentId.slice(0, 4);
    const lastPart = paymentId.slice(-4);
    return `${firstPart}****${lastPart}`;
  };

  const handleCopyPaymentId = async (paymentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(paymentId);
      dispatch(
        addToast({
          message: 'Payment ID copied to clipboard',
          type: 'success',
          duration: 3000,
        })
      );
    } catch (error) {
      dispatch(
        addToast({
          message: 'Failed to copy Payment ID',
          type: 'error',
          duration: 3000,
        })
      );
    }
  };

  return {
    // Balance
    balance,
    balanceLoading,
    refetchBalance,
    
    // History
    history,
    historyLoading,
    pagination,
    historyPage,
    setHistoryPage,
    
    // Top-up form
    topUpAmount,
    showTopUpForm,
    setShowTopUpForm,
    isProcessing,
    amountError,
    handleAmountChange,
    handleQRCodePayment,
    createQRCodeMutation,
    
    // QR Payment
    qrPaymentState,
    showQRPaymentModal,
    setShowQRPaymentModal,
    qrStatus,
    resetQRCodePayment,
    handleUTRChange,
    handleUTRSubmit,
    confirmPaymentMutation,
    closeQRCodeMutation,
    formatTimeRemaining,
    
    // Withdraw
    showWithdrawModal,
    setShowWithdrawModal,
    withdrawAmount,
    withdrawError,
    handleWithdrawClick,
    handleWithdrawAmountChange,
    handleMaxWithdrawClick,
    handleWithdrawSubmit,
    withdrawWalletMutation,
    
    // Utils
    formatDate,
    maskPaymentId,
    handleCopyPaymentId,
    user,
  } as UseWalletLogicReturn;
};
