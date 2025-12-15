import { useState } from 'react';
import { useJoinedTournaments, useUpdateRoomForUser, useApplyRoomUpdate } from '@services/api/hooks';
import { useAppSelector } from '@store/hooks';
import { selectUser } from '@store/slices/authSlice';
import type { Tournament, UpdateRoomRequest } from '@services/api';
import UserSidebar from '@components/user/common/UserSidebar';
import AppHeaderActions from '@components/common/AppHeaderActions';
import Loading from '@components/common/Loading';
import UpdateRoom from '@components/UpdateRoom/UpdateRoom';
import Toaster from '@components/common/Toaster';
import './Lobby.scss';
import '../Tournaments/Tournaments.scss';

const UserLobby: React.FC = () => {
  const { data: joinedTournaments = [], isLoading, error, refetch: refetchJoined } = useJoinedTournaments();
  const user = useAppSelector(selectUser);
  const updateRoomMutation = useUpdateRoomForUser();
  const applyRoomUpdateMutation = useApplyRoomUpdate();
  const [showUpdateRoomModal, setShowUpdateRoomModal] = useState(false);
  const [updatingRoomTournament, setUpdatingRoomTournament] = useState<Tournament | null>(null);
  const [applyingTournamentId, setApplyingTournamentId] = useState<string | null>(null);
  const [activePrizePoolTab, setActivePrizePoolTab] = useState<Record<string, 'expected' | 'current'>>({});

  // Check if user is host
  const isHostUser = user?.role === 'host';
  
  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  // Check if user can update room (assigned host with permission, or admin)
  const canUpdateRoom = (tournament: Tournament): boolean => {
    if (!user) return false;
    const userId = user._id || user.userId;
    const tournamentHostId = tournament.hostId;
    const isAssignedHost = tournamentHostId && (tournamentHostId === userId);
    
    // Admin can always update
    if (isAdmin) return true;
    
    // Host needs to be assigned AND have permission
    if (isHostUser && isAssignedHost) {
      return tournament.roomUpdatePermission === true;
    }
    
    return false;
  };

  // Check if host can apply for permission
  const canApplyForRoomUpdate = (tournament: Tournament): boolean => {
    if (!isHostUser || !user) return false;
    const userId = user._id || user.userId;
    const tournamentHostId = tournament.hostId;
    const isAssignedHost = tournamentHostId && (tournamentHostId === userId);
    
    // Can apply if: is assigned host AND (no permission yet OR application is rejected)
    if (isAssignedHost) {
      const hasPermission = tournament.roomUpdatePermission === true;
      const applicationStatus = tournament.roomUpdateApplicationStatus;
      return !hasPermission && applicationStatus !== 'pending';
    }
    
    return false;
  };

  const handleApplyRoomUpdate = async (tournamentId: string) => {
    setApplyingTournamentId(tournamentId);
    try {
      await applyRoomUpdateMutation.mutateAsync({ tournamentId });
      await refetchJoined();
    } catch (error: any) {
      console.error('Failed to apply for room update:', error);
    } finally {
      setApplyingTournamentId(null);
    }
  };

  const handleUpdateRoom = (tournament: Tournament) => {
    setUpdatingRoomTournament(tournament);
    setShowUpdateRoomModal(true);
  };

  const handleCloseUpdateRoom = () => {
    setShowUpdateRoomModal(false);
    setUpdatingRoomTournament(null);
  };

  const handleSubmitRoomUpdate = async (data: UpdateRoomRequest) => {
    try {
      await updateRoomMutation.mutateAsync(data);
      await refetchJoined();
      setShowUpdateRoomModal(false);
      setUpdatingRoomTournament(null);
    } catch (error: any) {
      console.error('Failed to update room:', error);
      throw error;
    }
  };

  // Calculate current prize pool based on joined teams/players
  const calculateCurrentPrizePool = (tournament: Tournament): number => {
    // If currentPrizePool is already provided, use it
    if (tournament.currentPrizePool?.winnerPrizePool !== undefined) {
      return tournament.currentPrizePool.winnerPrizePool;
    }

    // Calculate based on joined participants
    let totalEntryFees = 0;
    
    // For team-based tournaments (squad/duo)
    if ((tournament.subMode?.toLowerCase() === 'squad' || tournament.subMode?.toLowerCase() === 'duo') && tournament.maxTeams !== undefined) {
      const joinedTeams = tournament.joinedTeams !== undefined ? tournament.joinedTeams : 0;
      totalEntryFees = tournament.entryFee * joinedTeams;
    } else {
      // For solo tournaments
      const joinedCount = tournament.joinedCount !== undefined 
        ? tournament.joinedCount 
        : (tournament.participants?.length || 0);
      totalEntryFees = tournament.entryFee * joinedCount;
    }

    // Calculate fees - use percentage from potentialPrizePool if available
    let platformFee = 0;
    let hostFee = 0;
    let casterFee = 0;

    if (tournament.potentialPrizePool && tournament.potentialPrizePool.totalPrizePool > 0) {
      // Calculate fee percentages from potentialPrizePool
      const platformFeePercent = (tournament.potentialPrizePool.platformFee / tournament.potentialPrizePool.totalPrizePool) * 100;
      const hostFeePercent = (tournament.potentialPrizePool.hostFee / tournament.potentialPrizePool.totalPrizePool) * 100;
      const casterFeePercent = (tournament.potentialPrizePool.casterFee / tournament.potentialPrizePool.totalPrizePool) * 100;

      // Apply same percentages to current total entry fees
      platformFee = (totalEntryFees * platformFeePercent) / 100;
      hostFee = (totalEntryFees * hostFeePercent) / 100;
      casterFee = (totalEntryFees * casterFeePercent) / 100;
    } else {
      // Fallback to fixed fees if available
      platformFee = tournament.platformFee || tournament.currentPrizePool?.platformFee || 0;
      hostFee = tournament.hostFee || tournament.currentPrizePool?.hostFee || 0;
      casterFee = tournament.casterFee || tournament.currentPrizePool?.casterFee || 0;
    }

    const totalFees = platformFee + hostFee + casterFee;

    // Current prize pool = total entry fees - total fees
    return Math.max(0, totalEntryFees - totalFees);
  };

  return (
    <div className="user-lobby-container">
      <UserSidebar />
      <Toaster />

      <main className="user-main">
        <header className="user-header">
          <h1>Lobby</h1>
          <AppHeaderActions />
        </header>

        <div className="user-content">
          <div className="lobby-card">
            <h2 className="card-title">Joined Tournaments</h2>
            
            {isLoading ? (
              <div className="tournaments-loading">
                <Loading />
                <p>Loading your tournaments...</p>
              </div>
            ) : error ? (
              <div className="tournaments-error">
                <p>Error loading tournaments. Please try again later.</p>
              </div>
            ) : joinedTournaments.length > 0 ? (
              <div className="tournaments-list">
                {joinedTournaments.map((tournament) => (
                  <div key={tournament._id || tournament.id} className="tournament-card" data-tournament-id={tournament._id || tournament.id}>
                    <div className="tournament-header">
                      <div className="tournament-game-mode">
                        <span className="tournament-game">{tournament.game}</span>
                        <span className="tournament-mode">{tournament.mode} - {tournament.subMode}</span>
                      </div>
                      <span className={`tournament-status tournament-status-${tournament.status}`}>
                        {tournament.status}
                      </span>
                    </div>
                    <div className="tournament-details">
                      <div className="tournament-detail-item">
                        <span className="detail-label">Date:</span>
                        <span className="detail-value">
                          {tournament.date ? new Date(tournament.date).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          }) : 'N/A'}
                        </span>
                      </div>
                      <div className="tournament-detail-item">
                        <span className="detail-label">Time:</span>
                        <span className="detail-value">{tournament.startTime || 'N/A'}</span>
                      </div>
                      <div className="tournament-detail-item">
                        <span className="detail-label">Entry Fee:</span>
                        <span className="detail-value">₹{tournament.entryFee}</span>
                      </div>
                      <div className="tournament-detail-item prize-pool-container">
                        <div className="prize-pool-tabs">
                          <button 
                            className={`prize-pool-tab ${(activePrizePoolTab[tournament._id || tournament.id || ''] || 'expected') === 'expected' ? 'active' : ''}`}
                            onClick={() => {
                              const tournamentId = tournament._id || tournament.id || '';
                              setActivePrizePoolTab(prev => ({ ...prev, [tournamentId]: 'expected' }));
                            }}
                          >
                            Total Prize Pool
                          </button>
                          <button 
                            className={`prize-pool-tab ${(activePrizePoolTab[tournament._id || tournament.id || ''] || 'expected') === 'current' ? 'active' : ''}`}
                            onClick={() => {
                              const tournamentId = tournament._id || tournament.id || '';
                              setActivePrizePoolTab(prev => ({ ...prev, [tournamentId]: 'current' }));
                            }}
                          >
                            Current Prize Pool
                          </button>
                        </div>
                        <div className="prize-pool-content-wrapper">
                          <div className={`prize-pool-content ${(activePrizePoolTab[tournament._id || tournament.id || ''] || 'expected') === 'expected' ? 'active' : ''}`}>
                            <span className="detail-label">Expected Prize Pool:</span>
                            <span className="detail-value prize-pool">
                              ₹{tournament.winnerPrizePool ?? tournament.potentialPrizePool?.winnerPrizePool ?? tournament.prizePool ?? 0}
                            </span>
                          </div>
                          <div className={`prize-pool-content ${(activePrizePoolTab[tournament._id || tournament.id || ''] || 'expected') === 'current' ? 'active' : ''}`}>
                            <span className="detail-label">Current Prize Pool:</span>
                            <span className="detail-value prize-pool">
                              ₹{calculateCurrentPrizePool(tournament)}
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Show Teams for Squad/Duo, Players for Solo */}
                      {(tournament.subMode?.toLowerCase() === 'squad' || tournament.subMode?.toLowerCase() === 'duo') && tournament.maxTeams !== undefined ? (
                        <div className="tournament-detail-item">
                          <span className="detail-label">Teams:</span>
                          <span className="detail-value">
                            {tournament.joinedTeams !== undefined ? tournament.joinedTeams : 0}/{tournament.maxTeams}
                            {tournament.availableTeams !== undefined && (
                              <span className="available-slots"> ({tournament.availableTeams} available)</span>
                            )}
                          </span>
                        </div>
                      ) : (
                        <div className="tournament-detail-item">
                          <span className="detail-label">Players:</span>
                          <span className="detail-value">
                            {tournament.joinedCount !== undefined 
                              ? tournament.joinedCount 
                              : tournament.participants.length}/{tournament.maxPlayers}
                            {tournament.availableSlots !== undefined && (
                              <span className="available-slots"> ({tournament.availableSlots} available)</span>
                            )}
                          </span>
                        </div>
                      )}
                      {tournament.region && (
                        <div className="tournament-detail-item">
                          <span className="detail-label">Region:</span>
                          <span className="detail-value">{tournament.region}</span>
                        </div>
                      )}
                    </div>
                    {tournament.room && tournament.room.roomId && (
                      <div className="tournament-room">
                        <div className="room-info">
                          <span className="room-label">Room ID:</span>
                          <span className="room-value">{tournament.room.roomId}</span>
                        </div>
                        {tournament.room.password && (
                          <div className="room-info">
                            <span className="room-label">Password:</span>
                            <span className="room-value">{tournament.room.password}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="tournament-actions">
                      <button className="tournament-join-button tournament-joined-button" disabled>
                        Joined
                      </button>
                      {canUpdateRoom(tournament) && (
                        <button
                          className="tournament-join-button tournament-update-room-button"
                          onClick={() => handleUpdateRoom(tournament)}
                          disabled={updateRoomMutation.isPending}
                        >
                          {updateRoomMutation.isPending ? 'Updating...' : 'Update Room'}
                        </button>
                      )}
                      {canApplyForRoomUpdate(tournament) && (
                        <button
                          className="tournament-join-button tournament-apply-button"
                          onClick={() => handleApplyRoomUpdate(tournament._id || tournament.id || '')}
                          disabled={applyingTournamentId === (tournament._id || tournament.id)}
                        >
                          {applyingTournamentId === (tournament._id || tournament.id) ? 'Applying...' : 'Apply for Room Update'}
                        </button>
                      )}
                      {tournament.roomUpdateApplicationStatus === 'pending' && (
                        <button className="tournament-join-button tournament-pending-button" disabled>
                          Application Pending
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="card-content">You haven't joined any tournaments yet.</p>
            )}
          </div>
        </div>
      </main>

      {/* Update Room Modal */}
      {showUpdateRoomModal && updatingRoomTournament && (
        <UpdateRoom
          isOpen={showUpdateRoomModal}
          tournament={updatingRoomTournament}
          onClose={handleCloseUpdateRoom}
          onUpdate={handleSubmitRoomUpdate}
          isUpdating={updateRoomMutation.isPending}
        />
      )}
    </div>
  );
};

export default UserLobby;

