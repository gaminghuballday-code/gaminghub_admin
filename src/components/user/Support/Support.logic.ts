import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { USER_ROUTES } from '@utils/constants';
import { useAppSelector } from '@store/hooks';
import { selectUser, selectIsAuthenticated } from '@store/slices/authSlice';
import { useUserProfile } from '@services/api/hooks';
import {
  useHostTickets,
  useUpdateHostTicket,
  useUserTickets,
  useCreateTicket,
  useFAQs,
  useTicket,
  useReplyToTicket,
} from '@services/api/hooks/useSupportQueries';
import type { SupportTicket, UpdateTicketRequest, CreateTicketRequest } from '@services/api';
import { useMemo } from 'react';
import { useAppDispatch } from '@store/hooks';
import { addToast } from '@store/slices/toastSlice';

interface ChatMessage {
  sender: 'user' | 'support';
  content: string;
  timestamp: string;
}

export const useSupportPageLogic = () => {
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isHost = user?.role === 'host';

  // Filter states
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in-progress' | 'resolved' | 'closed'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageLimit] = useState<number>(10);

  // Ticket creation states (for users only)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState<CreateTicketRequest>({
    subject: '',
    issue: '',
    images: [],
  });

  // Update modal states (for hosts and admins)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateData, setUpdateData] = useState<UpdateTicketRequest>({
    status: undefined,
    notes: '',
  });

  // View ticket detail modal (for users) - now chat modal
  const [showTicketDetailModal, setShowTicketDetailModal] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  
  const dispatch = useAppDispatch();

  // TanStack Query hooks
  useUserProfile(isAuthenticated && !user);

  // Build query params
  const queryParams = {
    page: currentPage,
    limit: pageLimit,
    status: statusFilter === 'all' ? undefined : statusFilter,
  };

  // Use different hooks based on role
  const {
    data: hostTicketsData,
    isLoading: hostTicketsLoading,
    error: hostTicketsError,
    refetch: refetchHostTickets,
  } = useHostTickets(queryParams, isAuthenticated && isHost);

  const {
    data: userTicketsData,
    isLoading: userTicketsLoading,
    error: userTicketsError,
    refetch: refetchUserTickets,
  } = useUserTickets(queryParams, isAuthenticated && !isHost);

  const { data: faqsData, isLoading: faqsLoading } = useFAQs(isAuthenticated && !isHost);

  const {
    data: ticketDetail,
    isLoading: ticketDetailLoading,
    refetch: refetchTicketDetail,
  } = useTicket(selectedTicketId || '', isAuthenticated && !isHost && !!selectedTicketId);

  // Select appropriate data based on role
  const ticketsData = isHost ? hostTicketsData : userTicketsData;
  const ticketsLoading = isHost ? hostTicketsLoading : userTicketsLoading;
  const ticketsError = isHost ? hostTicketsError : userTicketsError;
  const refetchTickets = isHost ? refetchHostTickets : refetchUserTickets;

  const tickets = ticketsData?.tickets || [];
  const pagination = ticketsData?.pagination;
  const totalTickets = pagination?.totalItems || ticketsData?.total || 0;
  const totalPages = pagination?.totalPages ?? (totalTickets > 0 ? Math.ceil(totalTickets / pageLimit) : 1);
  const hasNextPage = pagination?.hasNextPage ?? (currentPage < totalPages);
  const hasPrevPage = pagination?.hasPrevPage ?? (currentPage > 1);

  const updateMutation = useUpdateHostTicket();
  const createMutation = useCreateTicket();
  const replyMutation = useReplyToTicket();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(USER_ROUTES.LOGIN);
      return;
    }
  }, [navigate, isAuthenticated]);

  const handleStatusFilterChange = (filter: 'all' | 'open' | 'in-progress' | 'resolved' | 'closed') => {
    setStatusFilter(filter);
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1 && totalPages > 0) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (totalPages > 0 && currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  // Create ticket handlers (users only)
  const handleOpenCreateModal = () => {
    setCreateData({
      subject: '',
      issue: '',
      images: [],
    });
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setCreateData({
      subject: '',
      issue: '',
      images: [],
    });
  };

  const handleCreateSubmit = async () => {
    if (!createData.subject.trim() || !createData.issue.trim()) {
      return;
    }

    // Prepare data for API
    const ticketData: CreateTicketRequest = {
      subject: createData.subject.trim(),
      issue: createData.issue.trim(),
    };

    if (createData.images && createData.images.length > 0) {
      ticketData.images = createData.images;
    }

    try {
      await createMutation.mutateAsync(ticketData);
      handleCloseCreateModal();
      refetchTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
    }
  };

  // Update ticket handlers (hosts only)
  const handleOpenUpdateModal = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setUpdateData({
      status: ticket.status,
      notes: ticket.notes || '',
    });
    setShowUpdateModal(true);
  };

  const handleCloseUpdateModal = () => {
    setShowUpdateModal(false);
    setSelectedTicket(null);
    setUpdateData({
      status: undefined,
      notes: '',
    });
  };

  const handleUpdateSubmit = async () => {
    if (!selectedTicket) {
      return;
    }

    try {
      const ticketId = selectedTicket._id || selectedTicket.id || selectedTicket.ticketId || '';
      await updateMutation.mutateAsync({
        ticketId,
        data: updateData,
      });
      handleCloseUpdateModal();
      refetchTickets();
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  // View ticket detail handlers (users only) - now chat modal
  const handleOpenTicketDetail = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setNewMessage('');
    setShowTicketDetailModal(true);
  };

  const handleCloseTicketDetail = () => {
    setShowTicketDetailModal(false);
    setSelectedTicketId(null);
    setNewMessage('');
  };

  // Parse chat messages from ticket
  const chatMessages = useMemo<ChatMessage[]>(() => {
    if (!ticketDetail) return [];

    const messages: ChatMessage[] = [];

    // Add initial user message from description or issue
    const initialMessage = ticketDetail.description || ticketDetail.issue || '';
    if (initialMessage) {
      messages.push({
        sender: 'user',
        content: initialMessage,
        timestamp: ticketDetail.createdAt,
      });
    }

    // Add messages from API if available
    if (ticketDetail.messages && Array.isArray(ticketDetail.messages)) {
      ticketDetail.messages.forEach((msg) => {
        messages.push({
          sender: msg.sender === 'user' ? 'user' : 'support',
          content: msg.message,
          timestamp: msg.createdAt,
        });
      });
    }

    // Parse notes as chat history (format: "sender|timestamp|message")
    if (ticketDetail.notes) {
      const noteLines = ticketDetail.notes.split('\n');
      for (const line of noteLines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        if (trimmedLine.includes('|') && trimmedLine.split('|').length >= 3) {
          const parts = trimmedLine.split('|');
          const [sender, timestamp, ...contentParts] = parts;
          messages.push({
            sender: sender.trim() as 'user' | 'support',
            content: contentParts.join('|').trim(),
            timestamp: timestamp.trim(),
          });
        }
      }
    }

    // Add resolution as support message if exists
    if (ticketDetail.resolution) {
      messages.push({
        sender: 'support',
        content: `Resolution: ${ticketDetail.resolution}`,
        timestamp: ticketDetail.resolvedAt || ticketDetail.updatedAt || new Date().toISOString(),
      });
    }

    return messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [ticketDetail]);

  // Send message handler
  const handleSendMessage = async () => {
    if (!selectedTicketId || !newMessage.trim()) {
      return;
    }

    try {
      await replyMutation.mutateAsync({
        ticketId: selectedTicketId,
        data: {
          message: newMessage.trim(),
        },
      });

      setNewMessage('');
      // Refetch tickets list to get updated data
      refetchTickets();
      // Refetch ticket detail to get updated messages
      // useReplyToTicket already invalidates the query, but we refetch immediately for better UX
      refetchTicketDetail();
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  return {
    user,
    isHost,
    tickets,
    ticketsLoading,
    ticketsError: ticketsError ? (ticketsError as Error).message : null,
    totalTickets,
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    pageLimit,
    statusFilter,
    handleStatusFilterChange,
    handlePreviousPage,
    handleNextPage,
    // Create ticket (users only)
    showCreateModal,
    createData,
    setCreateData,
    handleOpenCreateModal,
    handleCloseCreateModal,
    handleCreateSubmit,
    isCreating: createMutation.isPending,
    createError: createMutation.error ? (createMutation.error as Error).message : null,
    // Update ticket (hosts only)
    selectedTicket,
    showUpdateModal,
    updateData,
    setUpdateData,
    handleOpenUpdateModal,
    handleCloseUpdateModal,
    handleUpdateSubmit,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error ? (updateMutation.error as Error).message : null,
    // View ticket detail (users only) - now chat modal
    showTicketDetailModal,
    ticketDetail: ticketDetail || null,
    ticketDetailLoading,
    handleOpenTicketDetail,
    handleCloseTicketDetail,
    chatMessages,
    newMessage,
    setNewMessage,
    handleSendMessage,
    isSendingMessage: replyMutation.isPending,
    // FAQs (users only)
    faqs: faqsData || [],
    faqsLoading,
  };
};

