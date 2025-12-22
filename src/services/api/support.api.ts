import apiClient from './client';
import type {
  SupportTicket,
  CreateTicketRequest,
  UpdateTicketRequest,
  TicketReplyRequest,
  TicketReplyResponse,
  TicketsListResponse,
  TicketResponse,
  FAQ,
  FAQsListResponse,
} from '../types/api.types';

export const supportApi = {
  /**
   * Get all support tickets (Admin only)
   * @param params - Query parameters for filtering tickets
   */
  getAllTickets: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<{ tickets: SupportTicket[]; total?: number; pagination?: any }> => {
    const queryParams: Record<string, string> = {};

    if (params?.page) {
      queryParams.page = params.page.toString();
    }
    if (params?.limit) {
      queryParams.limit = params.limit.toString();
    }
    if (params?.status) {
      queryParams.status = params.status;
    }
    if (params?.search) {
      queryParams.search = params.search;
    }

    const response = await apiClient.get<TicketsListResponse>(
      '/api/admin/support/tickets',
      { params: queryParams }
    );

    const tickets = response.data?.data?.tickets;

    if (tickets && Array.isArray(tickets)) {
      const pagination = response.data?.data?.pagination;
      return {
        tickets: tickets.map((ticket) => ({
          ...ticket,
          id: ticket._id || ticket.id || ticket.ticketId,
        })),
        total: pagination?.totalItems || response.data?.data?.total || tickets.length,
        pagination: pagination,
      };
    }

    return {
      tickets: [],
      total: 0,
    };
  },

  /**
   * Update ticket status, resolution, or notes (Admin only)
   * @param ticketId - Ticket ID
   * @param data - Update data
   */
  updateTicket: async (
    ticketId: string,
    data: UpdateTicketRequest
  ): Promise<SupportTicket> => {
    const response = await apiClient.patch<TicketResponse>(
      `/api/admin/support/tickets/${ticketId}`,
      data
    );

    const ticket = response.data?.data?.ticket;
    if (!ticket) {
      throw new Error('Ticket not found in response');
    }

    return {
      ...ticket,
      id: ticket._id || ticket.id || ticket.ticketId,
    };
  },

  /**
   * Get host's support tickets
   * @param params - Query parameters for filtering tickets
   */
  getHostTickets: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ tickets: SupportTicket[]; total?: number; pagination?: any }> => {
    const queryParams: Record<string, string> = {};

    if (params?.page) {
      queryParams.page = params.page.toString();
    }
    if (params?.limit) {
      queryParams.limit = params.limit.toString();
    }
    if (params?.status) {
      queryParams.status = params.status;
    }

    const response = await apiClient.get<TicketsListResponse>(
      '/api/host/support/tickets',
      { params: queryParams }
    );

    const tickets = response.data?.data?.tickets;

    if (tickets && Array.isArray(tickets)) {
      const pagination = response.data?.data?.pagination;
      return {
        tickets: tickets.map((ticket) => ({
          ...ticket,
          id: ticket._id || ticket.id || ticket.ticketId,
        })),
        total: pagination?.totalItems || response.data?.data?.total || tickets.length,
        pagination: pagination,
      };
    }

    return {
      tickets: [],
      total: 0,
    };
  },

  /**
   * Update ticket status or add notes (Host)
   * @param ticketId - Ticket ID
   * @param data - Update data (status and/or notes)
   */
  updateHostTicket: async (
    ticketId: string,
    data: UpdateTicketRequest
  ): Promise<SupportTicket> => {
    const response = await apiClient.patch<TicketResponse>(
      `/api/host/support/tickets/${ticketId}`,
      data
    );

    const ticket = response.data?.data?.ticket;
    if (!ticket) {
      throw new Error('Ticket not found in response');
    }

    return {
      ...ticket,
      id: ticket._id || ticket.id || ticket.ticketId,
    };
  },

  /**
   * Get all active FAQs (Public)
   */
  getFAQs: async (): Promise<FAQ[]> => {
    const response = await apiClient.get<FAQsListResponse>('/api/support/faqs');

    const faqs = response.data?.data?.faqs;

    if (faqs && Array.isArray(faqs)) {
      return faqs.map((faq) => ({
        ...faq,
        id: faq._id || faq.id,
      }));
    }

    return [];
  },

  /**
   * Create support ticket/dispute (User)
   * @param data - Ticket creation data
   */
  createTicket: async (data: CreateTicketRequest): Promise<SupportTicket> => {
    const response = await apiClient.post<TicketResponse>(
      '/api/support/tickets',
      data
    );

    const ticket = response.data?.data?.ticket;
    if (!ticket) {
      throw new Error('Ticket not found in response');
    }

    return {
      ...ticket,
      id: ticket._id || ticket.id || ticket.ticketId,
    };
  },

  /**
   * Get user's support tickets
   * @param params - Query parameters for filtering tickets
   */
  getUserTickets: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ tickets: SupportTicket[]; total?: number; pagination?: any }> => {
    const queryParams: Record<string, string> = {};

    if (params?.page) {
      queryParams.page = params.page.toString();
    }
    if (params?.limit) {
      queryParams.limit = params.limit.toString();
    }
    if (params?.status) {
      queryParams.status = params.status;
    }

    const response = await apiClient.get<TicketsListResponse>(
      '/api/support/tickets',
      { params: queryParams }
    );

    const tickets = response.data?.data?.tickets;

    if (tickets && Array.isArray(tickets)) {
      const pagination = response.data?.data?.pagination;
      return {
        tickets: tickets.map((ticket) => ({
          ...ticket,
          id: ticket._id || ticket.id || ticket.ticketId,
        })),
        total: pagination?.totalItems || response.data?.data?.total || tickets.length,
        pagination: pagination,
      };
    }

    return {
      tickets: [],
      total: 0,
    };
  },

  /**
   * Get single ticket by ID (User)
   * @param ticketId - Ticket ID
   */
  getTicketById: async (ticketId: string): Promise<SupportTicket> => {
    const response = await apiClient.get<TicketResponse>(
      `/api/support/tickets/${ticketId}`
    );

    const ticket = response.data?.data?.ticket;
    if (!ticket) {
      throw new Error('Ticket not found in response');
    }

    return {
      ...ticket,
      id: ticket._id || ticket.id || ticket.ticketId,
    };
  },

  /**
   * Reply to a support ticket (User)
   * @param ticketId - Ticket ID
   * @param data - Reply data (message)
   */
  replyToTicket: async (ticketId: string, data: TicketReplyRequest): Promise<SupportTicket> => {
    const response = await apiClient.post<TicketReplyResponse>(
      `/api/support/tickets/${ticketId}/reply`,
      data
    );

    const ticket = response.data?.data?.ticket;
    if (!ticket) {
      throw new Error('Ticket not found in response');
    }

    return {
      ...ticket,
      id: ticket._id || ticket.id || ticket.ticketId,
    };
  },

  /**
   * Reply to a support ticket (Admin)
   * @param ticketId - Ticket ID
   * @param data - Reply data (message)
   */
  replyToTicketAsAdmin: async (ticketId: string, data: TicketReplyRequest): Promise<SupportTicket> => {
    // Try admin endpoint first, fallback to user endpoint if not available
    try {
      const response = await apiClient.post<TicketReplyResponse>(
        `/api/admin/support/tickets/${ticketId}/reply`,
        data
      );

      const ticket = response.data?.data?.ticket;
      if (!ticket) {
        throw new Error('Ticket not found in response');
      }

      return {
        ...ticket,
        id: ticket._id || ticket.id || ticket.ticketId,
      };
    } catch (error: any) {
      // If admin endpoint doesn't exist (404), fallback to user endpoint
      if (error?.response?.status === 404) {
        return supportApi.replyToTicket(ticketId, data);
      }
      throw error;
    }
  },
};

