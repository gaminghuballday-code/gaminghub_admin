import { useEffect, useRef, useCallback } from 'react';
import { getSocket } from '@services/websocket/socket';
import { useQueryClient } from '@tanstack/react-query';
import { walletKeys } from '@services/api/hooks/useWalletQueries';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { selectUser } from '@store/slices/authSlice';
import { addToast } from '@store/slices/toastSlice';

export interface WalletBalanceUpdate {
  userId: string;
  balanceGC: number;
  previousBalance?: number;
  transactionId?: string;
}

export interface WalletTransactionUpdate {
  transactionId: string;
  userId: string;
  status: 'pending' | 'success' | 'fail';
  amountGC: number;
  amountINR?: number;
  type: 'topup' | 'deduction' | 'refund';
  description?: string;
}

export interface WalletHistoryUpdate {
  transaction: {
    _id: string;
    userId: string;
    amountGC: number;
    type: string;
    status: string;
    description?: string;
    createdAt: string;
  };
}

interface UseWalletWebSocketOptions {
  enabled?: boolean;
  onBalanceUpdate?: (data: WalletBalanceUpdate) => void;
  onTransactionUpdate?: (data: WalletTransactionUpdate) => void;
  onHistoryUpdate?: (data: WalletHistoryUpdate) => void;
}

export const useWalletWebSocket = ({
  enabled = true,
  onBalanceUpdate,
  onTransactionUpdate,
  onHistoryUpdate,
}: UseWalletWebSocketOptions = {}) => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
  const subscribedRef = useRef(false);

  const invalidateWalletQueries = useCallback(() => {
    // Invalidate wallet balance and history queries to refetch updated data
    queryClient.invalidateQueries({ queryKey: walletKeys.balance() });
    queryClient.invalidateQueries({ queryKey: walletKeys.history() });
    queryClient.invalidateQueries({ queryKey: walletKeys.all });
  }, [queryClient]);

  useEffect(() => {
    const userId = user?._id || user?.userId;
    if (!enabled || !userId) {
      return;
    }

    const socket = getSocket();
    if (!socket) {
      return;
    }

    socketRef.current = socket;

    // Subscribe to wallet updates
    const subscribe = () => {
      if (!subscribedRef.current) {
        const userId = user._id || user.userId;
        if (userId) {
          socket.emit('subscribe:wallet', userId);
          subscribedRef.current = true;
        }
      }
    };

    // Wait for connection before subscribing
    if (socket.connected) {
      subscribe();
    } else {
      socket.once('connect', subscribe);
    }

    // Handle balance updates
    const handleBalanceUpdate = (data: WalletBalanceUpdate) => {
      const userId = user._id || user.userId;
      // Only process if it's for the current user
      if (data.userId !== userId) {
        return;
      }

      invalidateWalletQueries();

      // Show notification if balance changed
      if (data.previousBalance !== undefined && data.balanceGC !== data.previousBalance) {
        const difference = data.balanceGC - data.previousBalance;
        const message = difference > 0
          ? `Wallet balance updated! +${difference} GC added.`
          : `Wallet balance updated! ${Math.abs(difference)} GC deducted.`;
        
        dispatch(addToast({
          message,
          type: 'success',
          duration: 5000,
        }));
      }

      onBalanceUpdate?.(data);
    };

    // Handle transaction status updates (payment approve/reject)
    const handleTransactionUpdate = (data: WalletTransactionUpdate) => {
      const userId = user._id || user.userId;
      // Only process if it's for the current user
      if (data.userId !== userId) {
        return;
      }

      invalidateWalletQueries();

      // Show notification based on status
      if (data.status === 'success') {
        dispatch(addToast({
          message: `Payment approved! ${data.amountGC} GC added to your wallet.`,
          type: 'success',
          duration: 5000,
        }));
      } else if (data.status === 'fail') {
        dispatch(addToast({
          message: `Payment rejected. Please contact support if you believe this is an error.`,
          type: 'error',
          duration: 6000,
        }));
      }

      onTransactionUpdate?.(data);
    };

    // Handle new transaction in history
    const handleHistoryUpdate = (data: WalletHistoryUpdate) => {
      const userId = user._id || user.userId;
      // Only process if it's for the current user
      if (data.transaction.userId !== userId) {
        return;
      }

      invalidateWalletQueries();
      onHistoryUpdate?.(data);
    };

    // Register event listeners
    socket.on('wallet:balance-updated', handleBalanceUpdate);
    socket.on('wallet:transaction-updated', handleTransactionUpdate);
    socket.on('wallet:history-updated', handleHistoryUpdate);

    // Cleanup
    return () => {
      if (socket && subscribedRef.current) {
        socket.off('wallet:balance-updated', handleBalanceUpdate);
        socket.off('wallet:transaction-updated', handleTransactionUpdate);
        socket.off('wallet:history-updated', handleHistoryUpdate);

        // Unsubscribe
        const userId = user?._id || user?.userId;
        if (userId) {
          socket.emit('unsubscribe:wallet', userId);
        }
        subscribedRef.current = false;
      }
    };
  }, [enabled, user?._id, user?.userId, invalidateWalletQueries, dispatch, onBalanceUpdate, onTransactionUpdate, onHistoryUpdate]);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected ?? false,
    isSubscribed: subscribedRef.current,
  };
};
