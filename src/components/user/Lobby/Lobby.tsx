import { useState, useMemo } from 'react';
import { useJoinedTournaments, useHostApplicationsForUser, useUpdateRoomForUser, useUpdateHostRoom, useApplyRoomUpdate, useEndRoom, useDeclareResults } from '@services/api/hooks';
import { useAppSelector } from '@store/hooks';
import { selectUser } from '@store/slices/authSlice';
import type { Tournament, TournamentRules, UpdateRoomRequest } from '@services/api';
import UserSidebar from '@components/user/common/UserSidebar';
import AppHeaderActions from '@components/common/AppHeaderActions';
import Loading from '@components/common/Loading';
import UpdateRoom from '@components/UpdateRoom/UpdateRoom';
import Modal from '@components/common/Modal/Modal';
import Toaster from '@components/common/Toaster';
import ResultDeclaration from '@components/user/ResultDeclaration/ResultDeclaration';
import type { ResultDeclarationData } from '@components/user/ResultDeclaration/ResultDeclaration';
import TournamentResults from '@components/user/TournamentResults/TournamentResults';
import { useTournamentSocket } from '@hooks/useTournamentSocket';
import { useSidebarSync } from '@hooks/useSidebarSync';
import './Lobby.scss';
import '../Tournaments/Tournaments.scss';

const UserLobby: React.FC = () => {
  const user = useAppSelector(selectUser);
  const isHostUser = user?.role === 'host';
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useSidebarSync(sidebarOpen);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const {
    data: joinedTournamentsData = [],
    isLoading: joinedLoading,
    error: joinedError,
    refetch: refetchJoined,
  } = useJoinedTournaments(!isHostUser);

  const {
    data: hostApplications = [],
    isLoading: hostApplicationsLoading,
    refetch: refetchHostApplications,
  } = useHostApplicationsForUser(isHostUser);

  // For hosts, derive assigned lobbies from approved applications' tournamentId data
  const hostAssignedTournaments: Tournament[] = isHostUser
    ? (hostApplications || [])
        .filter((app) => app.status === 'approved' && (app as any).tournamentId)
        .map((app) => {
          const t = (app as any).tournamentId;
          return {
            ...(t as Tournament),
            _id: t._id,
            id: t._id || t.id,
          } as Tournament;
        })
    : [];

  const allJoinedTournaments = (isHostUser ? hostAssignedTournaments : joinedTournamentsData) || [];
  const isLoading = isHostUser ? hostApplicationsLoading : joinedLoading;
  const error = isHostUser ? undefined : joinedError;

  // Filter tournaments by selected date
  const joinedTournaments = useMemo(() => {
    if (!selectedDate) {
      return allJoinedTournaments;
    }
    return allJoinedTournaments.filter((tournament) => {
      if (!tournament.date) return false;
      const tournamentDate = new Date(tournament.date).toISOString().split('T')[0];
      return tournamentDate === selectedDate;
    });
  }, [allJoinedTournaments, selectedDate]);
  
  // WebSocket integration for real-time updates
  const currentUserId = user?._id || user?.userId;
  useTournamentSocket({
    subscriptionType: isHostUser ? 'host-tournaments' : 'user-tournaments',
    userId: currentUserId,
    onStatusUpdate: () => {
      if (isHostUser) {
        refetchHostApplications();
      } else {
        refetchJoined();
      }
    },
    onRoomUpdate: () => {
      if (isHostUser) {
        refetchHostApplications();
      } else {
        refetchJoined();
      }
    },
    enabled: !!currentUserId,
  });

  const updateRoomForUserMutation = useUpdateRoomForUser();
  const updateHostRoomMutation = useUpdateHostRoom();
  const updateRoomMutation = isHostUser ? updateHostRoomMutation : updateRoomForUserMutation;
  const applyRoomUpdateMutation = useApplyRoomUpdate();
  const endRoomMutation = useEndRoom();
  const declareResultsMutation = useDeclareResults();
  const [showUpdateRoomModal, setShowUpdateRoomModal] = useState(false);
  const [updatingRoomTournament, setUpdatingRoomTournament] = useState<Tournament | null>(null);
  const [applyingTournamentId, setApplyingTournamentId] = useState<string | null>(null);
  const [activePrizePoolTab, setActivePrizePoolTab] = useState<Record<string, 'expected' | 'current'>>({});
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [rulesTournament, setRulesTournament] = useState<Tournament | null>(null);
  const [showResultDeclarationModal, setShowResultDeclarationModal] = useState(false);
  const [resultDeclarationTournament, setResultDeclarationTournament] = useState<Tournament | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [resultsTournament, setResultsTournament] = useState<Tournament | null>(null);
  
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

  const handleOpenRulesModal = (tournament: Tournament) => {
    setRulesTournament(tournament);
    setShowRulesModal(true);
  };

  const handleCloseRulesModal = () => {
    setShowRulesModal(false);
    setRulesTournament(null);
  };

  const handleEndRoom = async (tournament: Tournament) => {
    const tournamentId = tournament._id || tournament.id;
    if (!tournamentId) return;

    if (window.confirm('Are you sure you want to end this room? This will change the tournament status to pending result.')) {
      try {
        await endRoomMutation.mutateAsync(tournamentId);
        if (isHostUser) {
          await refetchHostApplications();
        } else {
          await refetchJoined();
        }
      } catch (error: any) {
        console.error('Failed to end room:', error);
      }
    }
  };

  const handleDeclareResult = (tournament: Tournament) => {
    setResultDeclarationTournament(tournament);
    setShowResultDeclarationModal(true);
  };

  const handleCloseResultDeclaration = () => {
    setShowResultDeclarationModal(false);
    setResultDeclarationTournament(null);
  };

  const handleViewResults = (tournament: Tournament) => {
    setResultsTournament(tournament);
    setShowResultsModal(true);
  };

  const handleCloseResults = () => {
    setShowResultsModal(false);
    setResultsTournament(null);
  };

  const handleSubmitResults = async (data: ResultDeclarationData) => {
    const formData = new FormData();
    
    // Add screenshots
    data.screenshots.forEach((screenshot) => {
      formData.append(`screenshots`, screenshot);
    });

    // Add match results as JSON
    formData.append('matches', JSON.stringify(data.matches.map(match => ({
      matchNumber: match.matchNumber,
      participantResults: match.participantResults,
    }))));

    // Add final rankings
    formData.append('finalRankings', JSON.stringify(data.finalRankings));

    try {
      await declareResultsMutation.mutateAsync({
        tournamentId: data.tournamentId,
        formData,
      });
      
      if (isHostUser) {
        await refetchHostApplications();
      } else {
        await refetchJoined();
      }
      
      setShowResultDeclarationModal(false);
      setResultDeclarationTournament(null);
    } catch (error: any) {
      console.error('Failed to declare results:', error);
      throw error;
    }
  };

  const handleSubmitRoomUpdate = async (data: UpdateRoomRequest) => {
    try {
      const tournamentId = data.tournamentId;
      if (!tournamentId) return;

      if (isHostUser) {
        await updateHostRoomMutation.mutateAsync({
          tournamentId,
          data: {
            roomId: data.roomId,
            password: data.password,
          },
        });
        await refetchHostApplications();
      } else {
        await updateRoomForUserMutation.mutateAsync(data);
        await refetchJoined();
      }
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
    
    // For team-based tournaments (squad/duo/CS 4v4)
    if ((tournament.subMode?.toLowerCase() === 'squad' || tournament.subMode?.toLowerCase() === 'duo' || (tournament.mode?.toLowerCase() === 'cs' && tournament.subMode?.toLowerCase() === '4v4')) && tournament.maxTeams !== undefined) {
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
      <UserSidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <Toaster />

      <main className="user-main">
        <header className="user-header">
          <h1>Lobby</h1>
          <AppHeaderActions />
        </header>

        <div className="user-content">
          <div className="lobby-card">
            <div className="lobby-header-with-filter">
              <h2 className="card-title">{isHostUser ? 'Assigned Lobbies' : 'Joined Tournaments'}</h2>
              <div className="date-filter-wrapper">
                <label className="filter-label">Date:</label>
                <div className="date-input-wrapper">
                  <input
                    type="date"
                    className="date-filter-input"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    disabled={isLoading}
                  />
                  {selectedDate && (
                    <button
                      className="clear-date-button"
                      onClick={() => setSelectedDate('')}
                      disabled={isLoading}
                      title="Clear date filter"
                      aria-label="Clear date filter"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
            
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
                      {/* Show Teams for Squad/Duo/CS 4v4, Players for Solo */}
                      {((tournament.subMode?.toLowerCase() === 'squad' || tournament.subMode?.toLowerCase() === 'duo' || (tournament.mode?.toLowerCase() === 'cs' && tournament.subMode?.toLowerCase() === '4v4')) && tournament.maxTeams !== undefined) ? (
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
                              : (tournament.participants?.length || 0)}/{tournament.maxPlayers}
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
                      {/* Host actions for assigned lobbies */}
                      {isHostUser && tournament.status === 'live' && canUpdateRoom(tournament) && (
                        <>
                          <button
                            className="tournament-join-button tournament-update-room-button"
                            onClick={() => handleUpdateRoom(tournament)}
                            disabled={updateRoomMutation.isPending}
                          >
                            {updateRoomMutation.isPending ? 'Updating...' : 'Update Room'}
                          </button>
                          <button
                            className="tournament-join-button tournament-end-room-button"
                            onClick={() => handleEndRoom(tournament)}
                            disabled={endRoomMutation.isPending}
                          >
                            {endRoomMutation.isPending ? 'Ending...' : 'End Room'}
                          </button>
                        </>
                      )}
                      {/* Host actions for pendingResult status */}
                      {isHostUser && tournament.status === 'pendingResult' && canUpdateRoom(tournament) && (
                        <button
                          className="tournament-join-button tournament-declare-result-button"
                          onClick={() => handleDeclareResult(tournament)}
                        >
                          Declare Result
                        </button>
                      )}
                      {/* Regular user actions */}
                      {!isHostUser && tournament.status !== 'cancelled' && tournament.status !== 'completed' && tournament.status !== 'pendingResult' && (
                        <>
                          {canUpdateRoom(tournament) ? (
                            <button
                              className="tournament-join-button tournament-update-room-button"
                              onClick={() => handleUpdateRoom(tournament)}
                              disabled={updateRoomMutation.isPending}
                            >
                              {updateRoomMutation.isPending ? 'Updating...' : 'Update Room'}
                            </button>
                          ) : (
                            <button className="tournament-join-button tournament-joined-button" disabled>
                              Joined
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
                        </>
                      )}
                      {/* View Results button for completed tournaments */}
                      {tournament.status === 'completed' && (
                        <button
                          className="tournament-join-button tournament-results-button"
                          type="button"
                          onClick={() => handleViewResults(tournament)}
                        >
                          🏆 View Results
                        </button>
                      )}
                      {/* View Rules button should always be available */}
                      <button
                        className="tournament-join-button tournament-rules-button"
                        type="button"
                        onClick={() => handleOpenRulesModal(tournament)}
                      >
                        View Rules
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="card-content">
                {isHostUser ? 'No lobbies have been assigned to you yet.' : "You haven't joined any tournaments yet."}
              </p>
            )}
          </div>
{/* 
          {isHostUser && (
            <div className="lobby-card" style={{ marginTop: '1.5rem' }}>
              <h2 className="card-title">Your Host Applications</h2>

              {hostApplicationsLoading ? (
                <div className="tournaments-loading">
                  <Loading />
                  <p>Loading your applications...</p>
                </div>
              ) : hostApplications.length > 0 ? (
                <div className="tournaments-list">
                  {hostApplications.map((app) => (
                    <div key={app._id || app.id} className="tournament-card">
                      <div className="tournament-header">
                        <div className="tournament-game-mode">
                          <span className="tournament-game">
                            {(app as any).tournamentId?.game || 'Tournament'}
                          </span>
                          <span className="tournament-mode">
                            {(app as any).tournamentId?.mode} - {(app as any).tournamentId?.subMode}
                          </span>
                        </div>
                        <span className={`tournament-status tournament-status-${app.status}`}>
                          {app.status}
                        </span>
                      </div>
                      <div className="tournament-details">
                        {(app as any).tournamentId?.date && (
                          <div className="tournament-detail-item">
                            <span className="detail-label">Date:</span>
                            <span className="detail-value">
                              {new Date((app as any).tournamentId.date).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                              })}
                            </span>
                          </div>
                        )}
                        {(app as any).tournamentId?.startTime && (
                          <div className="tournament-detail-item">
                            <span className="detail-label">Time:</span>
                            <span className="detail-value">disconnectSocket
                              {(app as any).tournamentId.startTime}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="card-content">You have not applied to host any tournaments yet.</p>
              )}
            </div>
          )} */}
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

      {/* Lobby Rules Modal */}
      {showRulesModal && rulesTournament && (
        <Modal
          isOpen={showRulesModal}
          onClose={handleCloseRulesModal}
          showCloseButton
          title="Lobby Rules"
          className="modal-medium"
        >
          <div className="lobby-rules">
            {(() => {
              const rules =
                typeof rulesTournament.rules === 'object' && rulesTournament.rules !== null
                  ? (rulesTournament.rules as TournamentRules)
                  : undefined;

              const hasStructuredContent =
                !!rules &&
                (
                  !!rules.description ||
                  (Array.isArray(rules.generalRules) && rules.generalRules.length > 0) ||
                  (Array.isArray(rules.mapRotation) && rules.mapRotation.length > 0) ||
                  (rules.positionPoints && typeof rules.positionPoints === 'object') ||
                  !!rules.rules
                );

              return (
                <>
                  <h4 className="lobby-rules-title">
                    {rules?.title
                      ? rules.title
                      : `${rulesTournament.game} - ${rulesTournament.mode} ${rulesTournament.subMode}`}
                  </h4>

                  {rules?.description && (
                    <p className="lobby-rules-text">
                      {rules.description}
                    </p>
                  )}

                  {Array.isArray(rules?.generalRules) && rules.generalRules.length > 0 && (
                    <div className="lobby-rules-section">
                      <h5 className="lobby-rules-subtitle">General Rules</h5>
                      <ul className="lobby-rules-list">
                        {rules.generalRules.map((rule, idx) => (
                          <li key={idx}>{rule}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {Array.isArray(rules?.mapRotation) && rules.mapRotation.length > 0 && (
                    <div className="lobby-rules-section">
                      <h5 className="lobby-rules-subtitle">Map Rotation</h5>
                      <div className="lobby-rules-tags">
                        {rules.mapRotation.map((mapName, idx) => (
                          <span key={idx} className="lobby-rules-tag">
                            {mapName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {rules?.positionPoints && typeof rules.positionPoints === 'object' && (
                    <div className="lobby-rules-section">
                      <h5 className="lobby-rules-subtitle">Position Points</h5>
                      <ul className="lobby-rules-list">
                        {Object.entries(rules.positionPoints as Record<string | number, unknown>)
                          .sort(([aKey], [bKey]) => Number(aKey) - Number(bKey))
                          .map(([position, points]) => (
                            <li key={position}>
                              Position {position}: {String(points)}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}

                  {rules?.rules && (
                    <div className="lobby-rules-section">
                      <h5 className="lobby-rules-subtitle">Additional Rules</h5>
                      {Array.isArray(rules.rules) ? (
                        <ul className="lobby-rules-list">
                          {(rules.rules as unknown[])
                            .map((item) => String(item))
                            .filter((text) => text.trim().length > 0)
                            .map((text, idx) => (
                              <li key={idx}>{text}</li>
                            ))}
                        </ul>
                      ) : (
                        <p className="lobby-rules-text">
                          {String(rules.rules)}
                        </p>
                      )}
                    </div>
                  )}

                  {!hasStructuredContent && (
                    <p className="lobby-rules-text">
                      No rules have been provided for this lobby.
                    </p>
                  )}
                </>
              );
            })()}
          </div>
        </Modal>
      )}

      {/* Result Declaration Modal */}
      {showResultDeclarationModal && resultDeclarationTournament && (
        <ResultDeclaration
          isOpen={showResultDeclarationModal}
          tournament={resultDeclarationTournament}
          onClose={handleCloseResultDeclaration}
          onSubmit={handleSubmitResults}
          isSubmitting={declareResultsMutation.isPending}
        />
      )}

      {/* Tournament Results Modal */}
      {showResultsModal && resultsTournament && (
        <TournamentResults
          isOpen={showResultsModal}
          tournament={resultsTournament}
          onClose={handleCloseResults}
        />
      )}
    </div>
  );
};

export default UserLobby;

