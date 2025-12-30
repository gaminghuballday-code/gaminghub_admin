import { useEffect, useRef } from 'react';
import { getSocket } from '@services/websocket/socket';
import { useQueryClient } from '@tanstack/react-query';
import { supportKeys } from '@services/api/hooks/useSupportQueries';

export interface TicketReplyAdded {
  ticketId: string;
  reply: {
    _id: string;
    sender: 'user' | 'support';
    message: string;
    createdAt: string;
  };
}

export interface TicketStatusUpdate {
  ticketId: string;
  ticket: {
    _id: string;
    status: 'open' | 'in-progress' | 'resolved' | 'closed';
    updatedAt: string;
  };
}

interface UseSupportTicketsListSocketOptions {
  subscriptionType: 'user-tickets' | 'host-tickets' | 'admin-tickets';
  userId?: string | null;
  enabled?: boolean;
  onTicketUpdate?: () => void;
}

export const useSupportTicketsListSocket = ({
  subscriptionType,
  userId,
  enabled = true,
  onTicketUpdate,
}: UseSupportTicketsListSocketOptions) => {
  const queryClient = useQueryClient();
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      // Unsubscribe if disabled
      if (socketRef.current && subscribedRef.current) {
        if (subscriptionType === 'user-tickets' && userId) {
          socketRef.current.emit('unsubscribe:user-tickets', userId);
        } else if (subscriptionType === 'host-tickets' && userId) {
          socketRef.current.emit('unsubscribe:host-tickets', userId);
        } else if (subscriptionType === 'admin-tickets') {
          socketRef.current.emit('unsubscribe:admin-tickets');
        }
        subscribedRef.current = false;
      }
      return;
    }

    // For user-tickets and host-tickets, userId is required
    if ((subscriptionType === 'user-tickets' || subscriptionType === 'host-tickets') && !userId) {
      return;
    }

    const socket = getSocket();
    if (!socket) {
      return;
    }

    socketRef.current = socket;

    // Subscribe to tickets list updates
    const subscribe = () => {
      if (!subscribedRef.current) {
        if (subscriptionType === 'user-tickets' && userId) {
          socket.emit('subscribe:user-tickets', userId);
        } else if (subscriptionType === 'host-tickets' && userId) {
          socket.emit('subscribe:host-tickets', userId);
        } else if (subscriptionType === 'admin-tickets') {
          socket.emit('subscribe:admin-tickets');
        }
        subscribedRef.current = true;
      }
    };

    // Wait for connection before subscribing
    if (socket.connected) {
      subscribe();
    } else {
      socket.once('connect', subscribe);
    }

    // Handle ticket reply added - invalidate queries to refresh list
    const handleReplyAdded = (_data: TicketReplyAdded) => {
      // Invalidate tickets list queries
      queryClient.invalidateQueries({ queryKey: supportKeys.tickets() });
      onTicketUpdate?.();
    };

    // Handle ticket status update - invalidate queries to refresh list
    const handleStatusUpdate = (data: TicketStatusUpdate) => {
      // Invalidate tickets list queries
      queryClient.invalidateQueries({ queryKey: supportKeys.tickets() });
      // Also invalidate specific ticket query
      queryClient.invalidateQueries({ queryKey: supportKeys.ticket(data.ticketId) });
      onTicketUpdate?.();
    };

    // Handle ticket closed - invalidate queries
    const handleTicketClosed = ({ ticketId }: { ticketId: string }) => {
      // Invalidate tickets list queries
      queryClient.invalidateQueries({ queryKey: supportKeys.tickets() });
      // Also invalidate specific ticket query
      queryClient.invalidateQueries({ queryKey: supportKeys.ticket(ticketId) });
      onTicketUpdate?.();
    };

    // Register event listeners
    socket.on('ticket:reply-added', handleReplyAdded);
    socket.on('ticket:status-updated', handleStatusUpdate);
    socket.on('ticket:closed', handleTicketClosed);

    // Cleanup
    return () => {
      if (socket && subscribedRef.current) {
        socket.off('ticket:reply-added', handleReplyAdded);
        socket.off('ticket:status-updated', handleStatusUpdate);
        socket.off('ticket:closed', handleTicketClosed);

        // Unsubscribe
        if (subscriptionType === 'user-tickets' && userId) {
          socket.emit('unsubscribe:user-tickets', userId);
        } else if (subscriptionType === 'host-tickets' && userId) {
          socket.emit('unsubscribe:host-tickets', userId);
        } else if (subscriptionType === 'admin-tickets') {
          socket.emit('unsubscribe:admin-tickets');
        }
        subscribedRef.current = false;
      }
    };
  }, [enabled, subscriptionType, userId, queryClient, onTicketUpdate]);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected ?? false,
    isSubscribed: subscribedRef.current,
  };
};
