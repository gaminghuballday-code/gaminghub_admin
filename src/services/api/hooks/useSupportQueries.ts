import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supportApi } from '../support.api';
import type { CreateTicketRequest, UpdateTicketRequest, TicketReplyRequest } from '../../types/api.types';
import { useAppDispatch } from '@store/hooks';
import { addToast } from '@store/slices/toastSlice';

// Query keys
export const supportKeys = {
  all: ['support'] as const,
  tickets: () => [...supportKeys.all, 'tickets'] as const,
  adminTickets: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    [...supportKeys.tickets(), 'admin', params] as const,
  hostTickets: (params?: { page?: number; limit?: number; status?: string }) =>
    [...supportKeys.tickets(), 'host', params] as const,
  userTickets: (params?: { page?: number; limit?: number; status?: string }) =>
    [...supportKeys.tickets(), 'user', params] as const,
  ticket: (id: string) => [...supportKeys.tickets(), id] as const,
  faqs: () => [...supportKeys.all, 'faqs'] as const,
};

/**
 * Hook for fetching all support tickets (Admin only)
 */
export const useAdminTickets = (
  params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  },
  enabled = true
) => {
  return useQuery({
    queryKey: supportKeys.adminTickets(params),
    queryFn: () => supportApi.getAllTickets(params),
    enabled,
  });
};

/**
 * Hook for updating a ticket (Admin only)
 */
export const useUpdateTicket = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: ({ ticketId, data }: { ticketId: string; data: UpdateTicketRequest }) =>
      supportApi.updateTicket(ticketId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supportKeys.tickets() });
      dispatch(
        addToast({
          message: 'Ticket updated successfully',
          type: 'success',
          duration: 5000,
        })
      );
    },
    onError: (error: any) => {
      dispatch(
        addToast({
          message: error?.message || 'Failed to update ticket',
          type: 'error',
          duration: 6000,
        })
      );
    },
  });
};

/**
 * Hook for fetching host's support tickets
 */
export const useHostTickets = (
  params?: {
    page?: number;
    limit?: number;
    status?: string;
  },
  enabled = true
) => {
  return useQuery({
    queryKey: supportKeys.hostTickets(params),
    queryFn: () => supportApi.getHostTickets(params),
    enabled,
  });
};

/**
 * Hook for updating a ticket (Host)
 */
export const useUpdateHostTicket = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: ({ ticketId, data }: { ticketId: string; data: UpdateTicketRequest }) =>
      supportApi.updateHostTicket(ticketId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supportKeys.tickets() });
      dispatch(
        addToast({
          message: 'Ticket updated successfully',
          type: 'success',
          duration: 5000,
        })
      );
    },
    onError: (error: any) => {
      dispatch(
        addToast({
          message: error?.message || 'Failed to update ticket',
          type: 'error',
          duration: 6000,
        })
      );
    },
  });
};

/**
 * Hook for fetching all active FAQs
 */
export const useFAQs = (enabled = true) => {
  return useQuery({
    queryKey: supportKeys.faqs(),
    queryFn: () => supportApi.getFAQs(),
    enabled,
  });
};

/**
 * Hook for creating a support ticket (User)
 */
export const useCreateTicket = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (data: CreateTicketRequest) => supportApi.createTicket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supportKeys.tickets() });
      dispatch(
        addToast({
          message: 'Ticket created successfully',
          type: 'success',
          duration: 5000,
        })
      );
    },
    onError: (error: any) => {
      dispatch(
        addToast({
          message: error?.message || 'Failed to create ticket',
          type: 'error',
          duration: 6000,
        })
      );
    },
  });
};

/**
 * Hook for fetching user's support tickets
 */
export const useUserTickets = (
  params?: {
    page?: number;
    limit?: number;
    status?: string;
  },
  enabled = true
) => {
  return useQuery({
    queryKey: supportKeys.userTickets(params),
    queryFn: () => supportApi.getUserTickets(params),
    enabled,
  });
};

/**
 * Hook for fetching a single ticket by ID (User)
 */
export const useTicket = (ticketId: string, enabled = true) => {
  return useQuery({
    queryKey: supportKeys.ticket(ticketId),
    queryFn: () => supportApi.getTicketById(ticketId),
    enabled: enabled && !!ticketId,
  });
};

/**
 * Hook for replying to a support ticket (User)
 */
export const useReplyToTicket = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: ({ ticketId, data }: { ticketId: string; data: TicketReplyRequest }) =>
      supportApi.replyToTicket(ticketId, data),
    onSuccess: () => {
      // Only invalidate tickets list - WebSocket will handle ticket detail updates
      queryClient.invalidateQueries({ queryKey: supportKeys.tickets() });
      // Don't invalidate ticket detail - WebSocket will update it in real-time
      dispatch(
        addToast({
          message: 'Reply sent successfully',
          type: 'success',
          duration: 5000,
        })
      );
    },
    onError: (error: any) => {
      dispatch(
        addToast({
          message: error?.message || 'Failed to send reply',
          type: 'error',
          duration: 6000,
        })
      );
    },
  });
};

/**
 * Hook for replying to a support ticket as Admin
 */
export const useReplyToTicketAsAdmin = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: ({ ticketId, data }: { ticketId: string; data: TicketReplyRequest }) =>
      supportApi.replyToTicketAsAdmin(ticketId, data),
    onSuccess: () => {
      // Only invalidate tickets list - WebSocket will handle ticket detail updates
      queryClient.invalidateQueries({ queryKey: supportKeys.tickets() });
      // Don't invalidate ticket detail - WebSocket will update it in real-time
      dispatch(
        addToast({
          message: 'Reply sent successfully',
          type: 'success',
          duration: 5000,
        })
      );
    },
    onError: (error: any) => {
      dispatch(
        addToast({
          message: error?.message || 'Failed to send reply',
          type: 'error',
          duration: 6000,
        })
      );
    },
  });
};

