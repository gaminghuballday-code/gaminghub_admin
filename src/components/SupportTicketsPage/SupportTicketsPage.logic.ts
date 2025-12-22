import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@utils/constants';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import { selectUser, selectIsAuthenticated } from '@store/slices/authSlice';
import { addToast } from '@store/slices/toastSlice';
import { useProfile } from '@services/api/hooks';
import { useAdminTickets, useUpdateTicket, useReplyToTicketAsAdmin } from '@services/api/hooks/useSupportQueries';
import type { SupportTicket, UpdateTicketRequest } from '@services/api';
import { useSidebarSync } from '@hooks/useSidebarSync';

interface ChatMessage {
  sender: 'user' | 'support';
  content: string;
  timestamp: string;
}

export const useSupportTicketsPageLogic = () => {
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in-progress' | 'resolved' | 'closed'>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageLimit] = useState<number>(10);

  // Update modal states
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateData, setUpdateData] = useState<UpdateTicketRequest>({
    status: undefined,
    resolution: '',
    notes: '',
  });

  // Chat modal states
  const [selectedChatTicket, setSelectedChatTicket] = useState<SupportTicket | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  const dispatch = useAppDispatch();

  // TanStack Query hooks
  useProfile(isAuthenticated && !user);

  // Build query params
  const queryParams = {
    page: currentPage,
    limit: pageLimit,
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: searchFilter || undefined,
  };

  const {
    data: ticketsData,
    isLoading: ticketsLoading,
    error: ticketsError,
    refetch: refetchTickets,
  } = useAdminTickets(queryParams, isAuthenticated);

  const tickets = ticketsData?.tickets || [];
  const pagination = ticketsData?.pagination;
  const totalTickets = pagination?.totalItems || ticketsData?.total || 0;
  const totalPages = pagination?.totalPages || Math.ceil(totalTickets / pageLimit);
  const hasNextPage = pagination?.hasNextPage ?? (currentPage < totalPages);
  const hasPrevPage = pagination?.hasPrevPage ?? (currentPage > 1);

  const updateMutation = useUpdateTicket();
  const replyMutation = useReplyToTicketAsAdmin();

  // Sync selectedChatTicket with latest ticket data
  useEffect(() => {
    if (selectedChatTicket && tickets.length > 0) {
      const ticketId = selectedChatTicket._id || selectedChatTicket.id || selectedChatTicket.ticketId;
      const updatedTicket = tickets.find(
        (t) => (t._id || t.id || t.ticketId) === ticketId
      );
      if (updatedTicket) {
        setSelectedChatTicket(updatedTicket);
      }
    }
  }, [tickets, selectedChatTicket?._id, selectedChatTicket?.id, selectedChatTicket?.ticketId]);

  // Parse chat messages from ticket notes/description
  const chatMessages = useMemo<ChatMessage[]>(() => {
    if (!selectedChatTicket) return [];

    const messages: ChatMessage[] = [];

    // Add initial user message from description or issue
    const initialMessage = selectedChatTicket.description || selectedChatTicket.issue || '';
    if (initialMessage) {
      messages.push({
        sender: 'user',
        content: initialMessage,
        timestamp: selectedChatTicket.createdAt,
      });
    }

    // Add messages from API if available
    if (selectedChatTicket.messages && Array.isArray(selectedChatTicket.messages)) {
      selectedChatTicket.messages.forEach((msg) => {
        messages.push({
          sender: msg.sender === 'user' ? 'user' : 'support',
          content: msg.message,
          timestamp: msg.createdAt,
        });
      });
    }

    // Parse notes as chat history (format: "sender|timestamp|message")
    // Also handle simple notes that don't follow the format
    if (selectedChatTicket.notes) {
      const noteLines = selectedChatTicket.notes.split('\n');
      for (const line of noteLines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        if (trimmedLine.includes('|') && trimmedLine.split('|').length >= 3) {
          // Structured message format
          const parts = trimmedLine.split('|');
          const [sender, timestamp, ...contentParts] = parts;
          messages.push({
            sender: sender.trim() as 'user' | 'support',
            content: contentParts.join('|').trim(),
            timestamp: timestamp.trim(),
          });
        } else if (trimmedLine && !trimmedLine.startsWith('support|') && !trimmedLine.startsWith('user|')) {
          // Legacy notes format - treat as support message
          messages.push({
            sender: 'support',
            content: trimmedLine,
            timestamp: selectedChatTicket.updatedAt || selectedChatTicket.createdAt,
          });
        }
      }
    }

    // Add resolution as support message if exists
    if (selectedChatTicket.resolution) {
      messages.push({
        sender: 'support',
        content: `Resolution: ${selectedChatTicket.resolution}`,
        timestamp: selectedChatTicket.resolvedAt || selectedChatTicket.updatedAt || new Date().toISOString(),
      });
    }

    return messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [selectedChatTicket]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN);
      return;
    }
  }, [navigate, isAuthenticated]);

  // Sync sidebar state with CSS variable for dynamic layout
  useSidebarSync(sidebarOpen);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const handleStatusFilterChange = (filter: 'all' | 'open' | 'in-progress' | 'resolved' | 'closed') => {
    setStatusFilter(filter);
    setCurrentPage(1);
  };

  const handleSearchFilterChange = (search: string) => {
    setSearchFilter(search);
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handleOpenUpdateModal = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setUpdateData({
      status: ticket.status,
      resolution: ticket.resolution || '',
      notes: ticket.notes || '',
    });
    setShowUpdateModal(true);
  };

  const handleCloseUpdateModal = () => {
    setShowUpdateModal(false);
    setSelectedTicket(null);
    setUpdateData({
      status: undefined,
      resolution: '',
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

  const handleOpenChat = (ticket: SupportTicket) => {
    setSelectedChatTicket(ticket);
    setNewMessage('');
    setShowChatModal(true);
  };

  const handleCloseChat = () => {
    setShowChatModal(false);
    setSelectedChatTicket(null);
    setNewMessage('');
  };

  const handleSendMessage = async () => {
    if (!selectedChatTicket || !newMessage.trim()) {
      return;
    }

    try {
      const ticketId = selectedChatTicket._id || selectedChatTicket.id || selectedChatTicket.ticketId || '';
      
      const updatedTicket = await replyMutation.mutateAsync({
        ticketId,
        data: {
          message: newMessage.trim(),
        },
      });

      setNewMessage('');
      refetchTickets();
      
      // Update local state to show new message immediately
      if (updatedTicket) {
        setSelectedChatTicket(updatedTicket);
      }
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  const handleEndChat = async () => {
    if (!selectedChatTicket) {
      return;
    }

    try {
      const ticketId = selectedChatTicket._id || selectedChatTicket.id || selectedChatTicket.ticketId || '';
      await updateMutation.mutateAsync({
        ticketId,
        data: {
          status: 'closed',
        },
      });

      dispatch(
        addToast({
          message: 'Chat ended successfully',
          type: 'success',
          duration: 3000,
        })
      );

      refetchTickets();
      
      // Update local state
      if (selectedChatTicket) {
        const updatedTicket = {
          ...selectedChatTicket,
          status: 'closed' as const,
        };
        setSelectedChatTicket(updatedTicket);
      }
    } catch (error) {
      dispatch(
        addToast({
          message: 'Failed to end chat',
          type: 'error',
          duration: 5000,
        })
      );
    }
  };

  return {
    user,
    sidebarOpen,
    toggleSidebar,
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
    searchFilter,
    handleStatusFilterChange,
    handleSearchFilterChange,
    handlePreviousPage,
    handleNextPage,
    selectedTicket,
    showUpdateModal,
    updateData,
    setUpdateData,
    handleOpenUpdateModal,
    handleCloseUpdateModal,
    handleUpdateSubmit,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error ? (updateMutation.error as Error).message : null,
    showChatModal,
    selectedChatTicket,
    chatMessages,
    newMessage,
    setNewMessage,
    handleOpenChat,
    handleCloseChat,
    handleSendMessage,
    handleEndChat,
    isSendingMessage: replyMutation.isPending,
    isEndingChat: updateMutation.isPending,
  };
};

