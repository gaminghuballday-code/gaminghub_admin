import { useEffect, useRef } from 'react';
import { getSocket } from '@services/websocket/socket';

export interface TicketReplyAdded {
  ticketId: string;
  ticket: {
    _id: string;
    status: 'open' | 'closed';
    lastReplyAt: string;
    lastRepliedBy: string;
  };
  reply: {
    message: string;
    sentBy: string;
    role: 'user' | 'admin' | 'host';
    createdAt: string;
  };
  timestamp: string;
}

export interface TicketStatusUpdate {
  ticketId: string;
  ticket: {
    _id: string;
    status: 'open' | 'closed';
    resolvedAt?: string;
    resolvedBy?: string;
    lastReplyAt?: string;
    lastRepliedBy?: string;
  };
  isAutoClosed?: boolean;
  timestamp: string;
}

export interface TicketClosed {
  ticketId: string;
  timestamp: string;
}

interface UseSupportTicketSocketOptions {
  ticketId: string | null;
  enabled?: boolean;
  onReplyAdded?: (data: TicketReplyAdded) => void;
  onStatusUpdate?: (data: TicketStatusUpdate) => void;
  onTicketClosed?: (data: TicketClosed) => void;
}

export const useSupportTicketSocket = ({
  ticketId,
  enabled = true,
  onReplyAdded,
  onStatusUpdate,
  onTicketClosed,
}: UseSupportTicketSocketOptions) => {
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !ticketId) {
      // Unsubscribe if disabled or no ticketId
      if (socketRef.current && subscribedRef.current) {
        socketRef.current.emit('unsubscribe:ticket', ticketId);
        subscribedRef.current = false;
      }
      return;
    }

    const socket = getSocket();
    if (!socket) {
      return;
    }

    socketRef.current = socket;

    // Subscribe to ticket updates
    const subscribe = () => {
      if (!subscribedRef.current) {
        socket.emit('subscribe:ticket', ticketId);
        subscribedRef.current = true;
      }
    };

    // Wait for connection before subscribing
    if (socket.connected) {
      subscribe();
    } else {
      socket.once('connect', subscribe);
    }

    // Handle new reply added (backend event: ticket:reply-added)
    const handleReplyAdded = (data: TicketReplyAdded) => {
      // Only process if it's for the current ticket
      if (data.ticketId !== ticketId) {
        return;
      }
      onReplyAdded?.(data);
    };

    // Handle ticket status updates (backend event: ticket:status-updated)
    const handleStatusUpdate = (data: TicketStatusUpdate) => {
      // Only process if it's for the current ticket
      if (data.ticketId !== ticketId) {
        return;
      }
      onStatusUpdate?.(data);
    };

    // Handle ticket closed (backend event: ticket:closed)
    // Backend automatically disconnects socket after 1 second, but we handle it here too
    const handleTicketClosed = (data: TicketClosed) => {
      // Only process if it's for the current ticket
      if (data.ticketId !== ticketId) {
        return;
      }
      onTicketClosed?.(data);
      
      // Unsubscribe when ticket is closed (backend will also disconnect)
      if (subscribedRef.current) {
        socket.emit('unsubscribe:ticket', ticketId);
        subscribedRef.current = false;
      }
    };

    // Register event listeners (matching backend events)
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
        socket.emit('unsubscribe:ticket', ticketId);
        subscribedRef.current = false;
      }
    };
  }, [enabled, ticketId, onReplyAdded, onStatusUpdate, onTicketClosed]);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected ?? false,
    isSubscribed: subscribedRef.current,
  };
};
