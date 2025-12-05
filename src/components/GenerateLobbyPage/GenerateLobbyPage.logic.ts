import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Tournament, UpdateTournamentRequest, UpdateRoomRequest } from '@services/api';
import { ROUTES } from '@utils/constants';
import { useAppSelector } from '@store/hooks';
import { selectUser, selectIsAuthenticated } from '@store/slices/authSlice';
import {
  useProfile,
  useTournaments,
  useUpdateTournament,
  useDeleteTournament,
  useUpdateRoom,
} from '@services/api/hooks';

export const useGenerateLobbyPageLogic = () => {
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showGenerateLobbyModal, setShowGenerateLobbyModal] = useState(false);
  // Get current date in YYYY-MM-DD format

  const [tournamentStatus, setTournamentStatus] = useState<'upcoming' | 'live' | 'completed'>('upcoming');
  const [subModeFilter, setSubModeFilter] = useState<'all' | 'solo' | 'duo' | 'squad'>('all');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>([]);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tournamentToDelete, setTournamentToDelete] = useState<string | null>(null);
  const [showHostApplicationsModal, setShowHostApplicationsModal] = useState(false);
  const [tournamentForApplications, setTournamentForApplications] = useState<string | null>(null);
  const [tournamentForApplicationsData, setTournamentForApplicationsData] = useState<Tournament | null>(null);
  const [updatingRoomTournament, setUpdatingRoomTournament] = useState<Tournament | null>(null);
  const [showUpdateRoomModal, setShowUpdateRoomModal] = useState(false);

  // TanStack Query hooks
  useProfile(isAuthenticated && !user);
  
  // Get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };
  
  // Tournaments query
  const tournamentParams = {
    status: tournamentStatus,
    fromDate: selectedDate || (tournamentStatus === 'upcoming' ? getCurrentDate() : undefined),
  };
  const { data: tournaments = [], isLoading: tournamentsLoading, error: tournamentsQueryError, refetch: refetchTournaments } = useTournaments(
    tournamentParams,
    isAuthenticated
  );
  const tournamentsError = tournamentsQueryError ? (tournamentsQueryError as Error).message : null;
  
  const updateTournamentMutation = useUpdateTournament();
  const deleteTournamentMutation = useDeleteTournament();
  const updateRoomMutation = useUpdateRoom();

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN);
      return;
    }
  }, [navigate, isAuthenticated]);

  // Set default date when tournamentStatus is 'upcoming' and selectedDate is empty
  useEffect(() => {
    if (tournamentStatus === 'upcoming' && !selectedDate) {
      setSelectedDate(getCurrentDate());
    }
  }, [tournamentStatus, selectedDate]);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  // Filter tournaments by subMode (client-side filtering)
  useEffect(() => {
    let filtered = [...tournaments];
    
    // Filter by subMode
    if (subModeFilter !== 'all') {
      filtered = filtered.filter(t => t.subMode?.toLowerCase() === subModeFilter.toLowerCase());
    }
    
    setFilteredTournaments(filtered);
  }, [tournaments, subModeFilter]);

  // Handle edit tournament
  const handleEditTournament = (tournament: Tournament) => {
    setEditingTournament(tournament);
    setShowEditModal(true);
  };

  // Handle update tournament
  const handleUpdateTournament = async (data: UpdateTournamentRequest) => {
    if (!editingTournament) return;

    const tournamentId = editingTournament._id || editingTournament.id || '';
    if (!tournamentId) return;

    updateTournamentMutation.mutate(
      { tournamentId, data },
      {
        onSuccess: () => {
          setShowEditModal(false);
          setEditingTournament(null);
          refetchTournaments();
        },
        onError: (error: any) => {
          console.error('Failed to update tournament:', error);
          throw error;
        },
      }
    );
  };

  // Handle delete tournament
  const handleDeleteTournament = async () => {
    if (!tournamentToDelete) return;

    deleteTournamentMutation.mutate(tournamentToDelete, {
      onSuccess: () => {
        setShowDeleteModal(false);
        setTournamentToDelete(null);
        refetchTournaments();
      },
      onError: (error: any) => {
        console.error('Failed to delete tournament:', error);
        throw error;
      },
    });
  };

  // Open delete confirmation modal
  const openDeleteModal = (tournamentId: string) => {
    setTournamentToDelete(tournamentId);
    setShowDeleteModal(true);
  };

  // Handle view host applications
  const handleViewHostApplications = (tournamentId: string) => {
    const tournament = tournaments.find(t => (t._id || t.id) === tournamentId);
    setTournamentForApplications(tournamentId);
    setTournamentForApplicationsData(tournament || null);
    setShowHostApplicationsModal(true);
  };

  // Handle close host applications modal
  const handleCloseHostApplications = () => {
    setShowHostApplicationsModal(false);
    setTournamentForApplications(null);
    setTournamentForApplicationsData(null);
  };

  // Handle application processed (after approve/reject)
  const handleApplicationProcessed = () => {
    // Refresh tournaments to get updated host status
    refetchTournaments();
  };

  // Handle update room
  const handleUpdateRoom = (tournament: Tournament) => {
    setUpdatingRoomTournament(tournament);
    setShowUpdateRoomModal(true);
  };

  // Handle close update room modal
  const handleCloseUpdateRoom = () => {
    setShowUpdateRoomModal(false);
    setUpdatingRoomTournament(null);
  };

  // Handle submit room update
  const handleSubmitRoomUpdate = async (data: UpdateRoomRequest) => {
    if (!updatingRoomTournament) return;

    const tournamentId = updatingRoomTournament._id || updatingRoomTournament.id || '';
    if (!tournamentId) return;

    updateRoomMutation.mutate(
      { tournamentId, data },
      {
        onSuccess: () => {
          setShowUpdateRoomModal(false);
          setUpdatingRoomTournament(null);
          refetchTournaments();
        },
        onError: (error: any) => {
          console.error('Failed to update room:', error);
          throw error;
        },
      }
    );
  };

  return {
    user,
    sidebarOpen,
    toggleSidebar,
    showGenerateLobbyModal,
    setShowGenerateLobbyModal,
    tournamentStatus,
    setTournamentStatus,
    subModeFilter,
    setSubModeFilter,
    selectedDate,
    setSelectedDate,
    tournaments: filteredTournaments,
    tournamentsLoading,
    tournamentsError,
    refreshTournaments: refetchTournaments,
    editingTournament,
    showEditModal,
    setShowEditModal,
    setEditingTournament,
    handleEditTournament,
    handleUpdateTournament,
    isUpdating: updateTournamentMutation.isPending,
    showDeleteModal,
    setShowDeleteModal,
    tournamentToDelete,
    setTournamentToDelete,
    openDeleteModal,
    handleDeleteTournament,
    isDeleting: deleteTournamentMutation.isPending,
    showHostApplicationsModal,
    setShowHostApplicationsModal,
    tournamentForApplications,
    tournamentForApplicationsData,
    handleViewHostApplications,
    handleCloseHostApplications,
    handleApplicationProcessed,
    updatingRoomTournament,
    showUpdateRoomModal,
    setShowUpdateRoomModal,
    handleUpdateRoom,
    handleCloseUpdateRoom,
    handleSubmitRoomUpdate,
    isUpdatingRoom: updateRoomMutation.isPending,
  };
};

