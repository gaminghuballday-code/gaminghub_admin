import { useEffect, useRef, useCallback } from 'react';
import { getSocket } from '@services/websocket/socket';

import { useQueryClient } from '@tanstack/react-query';
import { tournamentsKeys } from '@services/api/hooks/useTournamentsQueries';

export interface TournamentStatusUpdate {
  tournamentId: string;
  status: 'upcoming' | 'live' | 'pendingResult' | 'completed';
  room?: {
    roomId: string | null;
    password: string | null;
  };
}

export interface TournamentRoomUpdate {
  tournamentId: string;
  room: {
    roomId: string | null;
    password: string | null;
  };
}

type SubscriptionType = 'tournament' | 'user-tournaments' | 'host-tournaments' | 'admin-tournaments';

interface UseTournamentSocketOptions {
  subscriptionType: SubscriptionType;
  tournamentId?: string;
  userId?: string;
  onStatusUpdate?: (data: TournamentStatusUpdate) => void;
  onRoomUpdate?: (data: TournamentRoomUpdate) => void;
  enabled?: boolean;
}

export const useTournamentSocket = ({
  subscriptionType,
  tournamentId,
  userId,
  onStatusUpdate,
  onRoomUpdate,
  enabled = true,
}: UseTournamentSocketOptions) => {
  const queryClient = useQueryClient();
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
  const subscribedRef = useRef<Set<string>>(new Set());

  const invalidateTournamentQueries = useCallback(() => {
    // Invalidate all tournament-related queries to refetch updated data
    queryClient.invalidateQueries({ queryKey: tournamentsKeys.all });
  }, [queryClient]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const socket = getSocket();
    if (!socket) {
      console.warn('Socket not available');
      return;
    }

    socketRef.current = socket;

    // Subscribe based on type
    const subscribe = () => {
      if (subscriptionType === 'tournament' && tournamentId) {
        if (!subscribedRef.current.has(tournamentId)) {
          socket.emit('subscribe:tournament', tournamentId);
          subscribedRef.current.add(tournamentId);
          console.log('Subscribed to tournament:', tournamentId);
        }
      } else if (subscriptionType === 'user-tournaments' && userId) {
        socket.emit('subscribe:user-tournaments', userId);
        console.log('Subscribed to user tournaments:', userId);
      } else if (subscriptionType === 'host-tournaments' && userId) {
        socket.emit('subscribe:host-tournaments', userId);
        console.log('Subscribed to host tournaments:', userId);
      } else if (subscriptionType === 'admin-tournaments') {
        socket.emit('subscribe:admin-tournaments');
        console.log('Subscribed to admin tournaments');
      }
    };

    // Wait for connection before subscribing
    if (socket.connected) {
      subscribe();
    } else {
      socket.once('connect', subscribe);
    }

    // Listen for status updates
    const handleStatusUpdate = (data: TournamentStatusUpdate) => {
      console.log('Tournament status updated:', data);
      invalidateTournamentQueries();
      onStatusUpdate?.(data);
    };

    // Listen for room updates
    const handleRoomUpdate = (data: TournamentRoomUpdate) => {
      console.log('Tournament room updated:', data);
      invalidateTournamentQueries();
      onRoomUpdate?.(data);
    };

    socket.on('tournament:status-updated', handleStatusUpdate);
    socket.on('tournament:room-updated', handleRoomUpdate);

    // Cleanup
    return () => {
      if (socket) {
        socket.off('tournament:status-updated', handleStatusUpdate);
        socket.off('tournament:room-updated', handleRoomUpdate);

        // Unsubscribe
        if (subscriptionType === 'tournament' && tournamentId) {
          socket.emit('unsubscribe:tournament', tournamentId);
          subscribedRef.current.delete(tournamentId);
        }
      }
    };
  }, [subscriptionType, tournamentId, userId, enabled, onStatusUpdate, onRoomUpdate, invalidateTournamentQueries]);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected ?? false,
  };
};

