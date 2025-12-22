import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@utils/constants';
import { useAppSelector } from '@store/hooks';
import { selectUser, selectIsAuthenticated } from '@store/slices/authSlice';
import { useProfile } from '@services/api/hooks';
import { useHostTickets, useUpdateHostTicket } from '@services/api/hooks/useSupportQueries';
import type { SupportTicket, UpdateTicketRequest } from '@services/api';
import { useSidebarSync } from '@hooks/useSidebarSync';

export const useHostSupportTicketsPageLogic = () => {
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in-progress' | 'resolved' | 'closed'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageLimit] = useState<number>(10);

  // Update modal states
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateData, setUpdateData] = useState<UpdateTicketRequest>({
    status: undefined,
    notes: '',
  });

  // TanStack Query hooks
  useProfile(isAuthenticated && !user);

  // Build query params
  const queryParams = {
    page: currentPage,
    limit: pageLimit,
    status: statusFilter === 'all' ? undefined : statusFilter,
  };

  const {
    data: ticketsData,
    isLoading: ticketsLoading,
    error: ticketsError,
    refetch: refetchTickets,
  } = useHostTickets(queryParams, isAuthenticated);

  const tickets = ticketsData?.tickets || [];
  const pagination = ticketsData?.pagination;
  const totalTickets = pagination?.totalItems || ticketsData?.total || 0;
  const totalPages = pagination?.totalPages || Math.ceil(totalTickets / pageLimit);
  const hasNextPage = pagination?.hasNextPage ?? (currentPage < totalPages);
  const hasPrevPage = pagination?.hasPrevPage ?? (currentPage > 1);

  const updateMutation = useUpdateHostTicket();

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
    handleStatusFilterChange,
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
  };
};

