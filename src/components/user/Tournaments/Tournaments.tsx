import { useState, useEffect, useRef, useMemo } from 'react';
import { useUserTournaments, useJoinTournament, useJoinedTournaments, useApplyForHostTournament, useAvailableHostTournaments, useUpdateHostRoom } from '@services/api/hooks';
import { useAppSelector } from '@store/hooks';
import { selectUser } from '@store/slices/authSlice';
import type { Tournament, TournamentRules, UpdateRoomRequest } from '@services/api';
import UserSidebar from '@components/user/common/UserSidebar';
import AppHeaderActions from '@components/common/AppHeaderActions';
import Loading from '@components/common/Loading';
import Toaster from '@components/common/Toaster';
import Modal from '@components/common/Modal/Modal';
import UpdateRoom from '@components/UpdateRoom/UpdateRoom';
import { useTournamentSocket } from '@hooks/useTournamentSocket';
import { getTimeUntilLive, formatTimeRemaining } from '@utils/tournamentTimer';
import './Tournaments.scss';
import '../Lobby/Lobby.scss';

type TournamentTab = 'upcoming' | 'live' | 'completed' | 'cancelled' | 'pendingResult';

const UserTournaments: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TournamentTab>('upcoming');
  
  // Get user data first (needed for WebSocket and role check)
  const user = useAppSelector(selectUser);
  
  // Check if user is host - hosts don't join as players, they can apply to host
  const isHost = user?.role === 'host';

  // Determine API status parameter based on active tab
  const getApiStatus = (tab: TournamentTab): string | undefined => {
    if (tab === 'upcoming') return 'upcoming';
    if (tab === 'live') return 'live';
    if (tab === 'completed') return 'completed';
    if (tab === 'cancelled') return 'cancelled';
    if (tab === 'pendingResult') return 'pendingResult'; // API might support this
    return undefined;
  };
  
  // Fetch tournaments with status parameter (for regular users)
  const { data: userTournaments = [], isLoading: userTournamentsLoading, error: userTournamentsError, refetch: refetchUserTournaments } = useUserTournaments(
    activeTab === 'pendingResult' ? { status: 'pendingResult' } : { status: getApiStatus(activeTab) },
    !isHost // Only fetch for non-hosts
  );

  // Fetch available tournaments with application status (for hosts)
  const apiStatus = activeTab === 'pendingResult' ? undefined : getApiStatus(activeTab);
  const { data: availableHostTournaments = [], isLoading: availableHostTournamentsLoading, error: availableHostTournamentsError, refetch: refetchAvailableHostTournaments } = useAvailableHostTournaments(
    apiStatus, // Pass status parameter for hosts
    isHost // Only fetch for hosts
  );

  // Use appropriate data source based on user role
  const allTournaments = isHost ? availableHostTournaments : userTournaments;
  const isLoading = isHost ? availableHostTournamentsLoading : userTournamentsLoading;
  const error = isHost ? availableHostTournamentsError : userTournamentsError;
  
  const refetchTournaments = isHost ? refetchAvailableHostTournaments : refetchUserTournaments;

  const { data: joinedTournaments = [], refetch: refetchJoined } = useJoinedTournaments(!isHost);

  // WebSocket integration for real-time updates
  const currentUserId = user?._id || user?.userId;
  useTournamentSocket({
    subscriptionType: 'user-tournaments',
    userId: currentUserId,
    onStatusUpdate: () => {
      refetchTournaments();
      refetchJoined();
    },
    onRoomUpdate: () => {
      refetchTournaments();
      refetchJoined();
    },
    enabled: !!currentUserId,
  });

  // Filter tournaments based on active tab (client-side fallback if API doesn't support pendingResult status)
  const tournaments = useMemo(() => {
    return allTournaments.filter((tournament) => {
      if (activeTab === 'upcoming') {
        return tournament.status === 'upcoming';
      } else if (activeTab === 'live') {
        return tournament.status === 'live';
      } else if (activeTab === 'completed') {
        return tournament.status === 'completed';
      } else if (activeTab === 'cancelled') {
        return tournament.status === 'cancelled';
      } else if (activeTab === 'pendingResult') {
        // Pending result: completed tournaments with no results or empty results
        // If API supports pendingResult status, this filter might not be needed
        return tournament.status === 'completed' && 
               (!tournament.results || tournament.results.length === 0);
      }
      return false;
    });
  }, [allTournaments, activeTab]);

  // Timer state for upcoming tournaments
  const [timeRemaining, setTimeRemaining] = useState<Record<string, string>>({});
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previousTimersRef = useRef<string>('');

  // Update timers for upcoming tournaments
  useEffect(() => {
    const updateTimers = () => {
      const timers: Record<string, string> = {};
      tournaments.forEach((tournament) => {
        if (tournament.status === 'upcoming') {
          const timeUntilLive = getTimeUntilLive(tournament);
          if (timeUntilLive !== null) {
            timers[tournament._id || tournament.id || ''] = formatTimeRemaining(timeUntilLive);
          }
        }
      });
      
      // Only update state if the timer values actually changed
      const timersString = JSON.stringify(timers);
      if (timersString !== previousTimersRef.current) {
        previousTimersRef.current = timersString;
        setTimeRemaining(timers);
      }
    };

    updateTimers();
    timerIntervalRef.current = setInterval(updateTimers, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [tournaments]);
  const joinTournamentMutation = useJoinTournament();
  const applyForHostMutation = useApplyForHostTournament();
  const updateHostRoomMutation = useUpdateHostRoom();
  const [joiningTournamentId, setJoiningTournamentId] = useState<string | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joiningTournament, setJoiningTournament] = useState<Tournament | null>(null);
  const [teamName, setTeamName] = useState('');
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [joinFormError, setJoinFormError] = useState<string | null>(null);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [rulesTournament, setRulesTournament] = useState<Tournament | null>(null);
  const [applyingHostTournamentId, setApplyingHostTournamentId] = useState<string | null>(null);
  const [showUpdateRoomModal, setShowUpdateRoomModal] = useState(false);
  const [updatingRoomTournament, setUpdatingRoomTournament] = useState<Tournament | null>(null);

  // Create a Set of joined tournament IDs for quick lookup
  const joinedTournamentIds = new Set(
    joinedTournaments.map((t) => t._id || t.id).filter(Boolean) as string[]
  );

  const openJoinModal = (tournament: Tournament) => {
    const tournamentId = tournament._id || tournament.id;
    if (!tournamentId) return;
    if (joinedTournamentIds.has(tournamentId)) {
      return; // Already joined
    }

    setJoiningTournamentId(tournamentId);
    setJoiningTournament(tournament);
    setShowJoinModal(true);
    setJoinFormError(null);

    const primaryName =
      user?.name ||
      user?.ign ||
      (user?.email ? user.email.split('@')[0] : '') ||
      '';

    // Max 5 players including the one who is registering.
    // First slot is pre-filled with current user, remaining 4 optional.
    setPlayerNames([
      primaryName,
      '',
      '',
      '',
      '',
    ]);

    // Pre-fill team name with IGN or username if available (user can change)
    setTeamName(
      tournament.subMode?.toLowerCase() === 'squad' || tournament.subMode?.toLowerCase() === 'duo'
        ? `${primaryName || 'My'} Team`
        : primaryName || ''
    );
  };

  const closeJoinModal = () => {
    setShowJoinModal(false);
    setJoiningTournament(null);
    setJoiningTournamentId(null);
    setJoinFormError(null);
  };

  const handleSubmitJoin = async () => {
    if (!joiningTournament) return;
    const tournamentId = joiningTournament._id || joiningTournament.id;
    if (!tournamentId) return;

    const trimmedTeamName = teamName.trim();
    if (!trimmedTeamName) {
      setJoinFormError('Team name is required.');
      return;
    }

    const players = playerNames
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    if (players.length === 0) {
      setJoinFormError('At least one player name is required.');
      return;
    }

    try {
      await joinTournamentMutation.mutateAsync({
        tournamentId,
        teamName: trimmedTeamName,
        players,
      });
      await refetchJoined();
      closeJoinModal();
    } catch (error: any) {
      console.error('Failed to join tournament:', error);
      setJoinFormError(error?.message || 'Failed to join tournament. Please try again.');
    }
  };

  const handleOpenRulesModal = (tournament: Tournament) => {
    setRulesTournament(tournament);
    setShowRulesModal(true);
  };

  const handleCloseRulesModal = () => {
    setShowRulesModal(false);
    setRulesTournament(null);
  };

  const isJoining = (tournamentId: string) => joiningTournamentId === tournamentId;
  const isJoined = (tournamentId: string) => joinedTournamentIds.has(tournamentId);

  const handleApplyForHost = async (tournamentId: string) => {
    if (!tournamentId) return;
    setApplyingHostTournamentId(tournamentId);
    try {
      await applyForHostMutation.mutateAsync(tournamentId);
      // Refetch available tournaments to get updated application status
      // The mutation hook will invalidate the cache, but we also refetch to ensure immediate update
      await refetchTournaments();
    } catch (error: any) {
      console.error('Failed to apply as host:', error);
    } finally {
      setApplyingHostTournamentId(null);
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
      const tournamentId = data.tournamentId;
      if (!tournamentId) return;

      await updateHostRoomMutation.mutateAsync({
        tournamentId,
        data: {
          roomId: data.roomId,
          password: data.password,
        },
      });
      await refetchTournaments();
      setShowUpdateRoomModal(false);
      setUpdatingRoomTournament(null);
    } catch (error: any) {
      console.error('Failed to update room:', error);
      throw error;
    }
  };

  return (
    <div className="user-tournaments-container">
      <UserSidebar />
      <Toaster />

      <main className="user-main">
        <header className="user-header">
          <h1>Tournaments</h1>
          <AppHeaderActions />
        </header>

        <div className="user-content">
          <div className="tournaments-card">
            <h2 className="card-title">Available Tournaments</h2>
            
            {/* Tabs */}
            <div className="tournaments-tabs">
              <button
                className={`tournament-tab ${activeTab === 'upcoming' ? 'active' : ''}`}
                onClick={() => setActiveTab('upcoming')}
                type="button"
              >
                Upcoming
              </button>
              <button
                className={`tournament-tab ${activeTab === 'live' ? 'active' : ''}`}
                onClick={() => setActiveTab('live')}
                type="button"
              >
                Live
              </button>
              <button
                className={`tournament-tab ${activeTab === 'completed' ? 'active' : ''}`}
                onClick={() => setActiveTab('completed')}
                type="button"
              >
                Completed
              </button>
              <button
                className={`tournament-tab ${activeTab === 'cancelled' ? 'active' : ''}`}
                onClick={() => setActiveTab('cancelled')}
                type="button"
              >
                Cancelled
              </button>
              <button
                className={`tournament-tab ${activeTab === 'pendingResult' ? 'active' : ''}`}
                onClick={() => setActiveTab('pendingResult')}
                type="button"
              >
                Pending Result
              </button>
            </div>
            
            {isLoading ? (
              <div className="tournaments-loading">
                <Loading />
                <p>Loading tournaments...</p>
              </div>
            ) : error ? (
              <div className="tournaments-error">
                <p>Error loading tournaments. Please try again later.</p>
              </div>
            ) : tournaments.length > 0 ? (
              <div className="tournaments-list">
                {tournaments.map((tournament) => (
                  <div key={tournament._id || tournament.id} className="tournament-card">
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
                      {tournament.status === 'live' && tournament.room?.roomId && (
                        <>
                          <div className="tournament-detail-item">
                            <span className="detail-label">Room ID:</span>
                            <span className="detail-value tournament-room-id">{tournament.room.roomId}</span>
                          </div>
                          {tournament.room.password && (
                            <div className="tournament-detail-item">
                              <span className="detail-label">Password:</span>
                              <span className="detail-value tournament-room-password">{tournament.room.password}</span>
                            </div>
                          )}
                        </>
                      )}
                      <div className="tournament-detail-item">
                        <span className="detail-label">Entry Fee:</span>
                        <span className="detail-value">₹{tournament.entryFee}</span>
                      </div>
                      <div className="tournament-detail-item">
                        <span className="detail-label">Prize Pool:</span>
                        <span className="detail-value prize-pool">
                          ₹
                          {tournament.winnerPrizePool ??
                            tournament.potentialPrizePool?.winnerPrizePool ??
                            tournament.prizePool}
                        </span>
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
                      )
                       : 
                       (
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
                      )
                      }
                      {tournament.region && (
                        <div className="tournament-detail-item">
                          <span className="detail-label">Region:</span>
                          <span className="detail-value">{tournament.region}</span>
                        </div>
                      )}
                    </div>
                    <div className="tournament-actions">
                      {/* Hide all action buttons for cancelled, completed, and pendingResult tournaments - only show View Rules */}
                      {tournament.status !== 'cancelled' && tournament.status !== 'completed' && tournament.status !== 'pendingResult' && (
                        <>
                          {isHost ? (
                            (() => {
                              // Normalize hostId to string for comparison
                              let hostId: string | null = null;
                              if (tournament.hostId) {
                                if (typeof tournament.hostId === 'string') {
                                  hostId = tournament.hostId.trim();
                                } else if (typeof tournament.hostId === 'object' && tournament.hostId !== null) {
                                  // Handle case where hostId might be an object with _id
                                  hostId = String((tournament.hostId as any)._id || (tournament.hostId as any).hostId || tournament.hostId).trim();
                                } else {
                                  hostId = String(tournament.hostId).trim();
                                }
                              }
                              
                              // Normalize currentUserId to string for comparison
                              const normalizedCurrentUserId = currentUserId ? String(currentUserId).trim() : null;
                              
                              // Check if current user is the assigned host (strict comparison)
                              const isUserAssignedHost = hostId && normalizedCurrentUserId && 
                                hostId === normalizedCurrentUserId;
                              
                              // Check if any other host is assigned (but not the current user)
                              const isAnyHostAssigned = !!hostId && !isUserAssignedHost;
                              
                              const tournamentId = (tournament._id || tournament.id || '') as string;
                              
                              // Check application status from API response
                              const hasApplied = tournament.hasApplied === true;
                              const applicationStatus = tournament.applicationStatus;
                              const isApplicationPending = hasApplied && applicationStatus === 'pending';

                              // If user is assigned host, show Update Room button
                              if (isUserAssignedHost) {
                                return (
                                  <button
                                    className="tournament-join-button"
                                    type="button"
                                    onClick={() => handleUpdateRoom(tournament)}
                                  >
                                    Update Room
                                  </button>
                                );
                              }

                              // If another host is assigned, show disabled button
                              if (isAnyHostAssigned) {
                                return (
                                  <button className="tournament-join-button tournament-joined-button" disabled>
                                    Host already assigned
                                  </button>
                                );
                              }

                              // If application is pending, show Applied button
                              if (isApplicationPending) {
                                return (
                                  <button className="tournament-join-button tournament-pending-button" disabled>
                                    Applied
                                  </button>
                                );
                              }

                              // Otherwise, show Apply for Host button
                              return (
                                <button
                                  className="tournament-join-button"
                                  type="button"
                                  onClick={() => handleApplyForHost(tournamentId)}
                                  disabled={
                                    applyingHostTournamentId === tournamentId || applyForHostMutation.isPending
                                  }
                                >
                                  {applyingHostTournamentId === tournamentId && applyForHostMutation.isPending
                                    ? 'Applying...'
                                    : 'Apply for Host'}
                                </button>
                              );
                            })()
                          ) : (
                            isJoined(tournament._id || tournament.id || '') ? (
                              <button className="tournament-join-button tournament-joined-button" disabled>
                                Joined
                              </button>
                            ) : (
                              <button
                                className="tournament-join-button"
                                onClick={() => openJoinModal(tournament as Tournament)}
                                disabled={isJoining(tournament._id || tournament.id || '') || joinTournamentMutation.isPending}
                              >
                                {isJoining(tournament._id || tournament.id || '') && joinTournamentMutation.isPending
                                  ? 'Joining...'
                                  : 'Join'}
                              </button>
                            )
                          )}
                        </>
                      )}
                      {/* View Rules button should always be available */}
                      <button
                        className="tournament-join-button tournament-rules-button"
                        type="button"
                        onClick={() => handleOpenRulesModal(tournament as Tournament)}
                      >
                        View Rules
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="card-content">
                {activeTab === 'upcoming' && 'No upcoming tournaments available at the moment.'}
                {activeTab === 'live' && 'No live tournaments at the moment.'}
                {activeTab === 'completed' && 'No completed tournaments found.'}
                {activeTab === 'pendingResult' && 'No tournaments with pending results.'}
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Join Tournament Modal */}
      {showJoinModal && joiningTournament && (
        <Modal
          isOpen={showJoinModal}
          onClose={closeJoinModal}
          showCloseButton
          title="Join Tournament"
          className="modal-medium"
        >
          <div className="lobby-rules join-tournament-modal">
            <h4 className="lobby-rules-title">
              {joiningTournament.game} - {joiningTournament.mode} {joiningTournament.subMode}
            </h4>

            <div className="lobby-rules-section">
              <label className="lobby-rules-subtitle" htmlFor="team-name-input">
                Team Name (required)
              </label>
              <input
                id="team-name-input"
                type="text"
                className="tournament-input tournament-input-full"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter your team name"
              />
            </div>

            <div className="lobby-rules-section">
              <h5 className="lobby-rules-subtitle">Players (max 5)</h5>
              <ul className="lobby-rules-list">
                {playerNames.map((name, index) => (
                  <li key={index}>
                    <div className="player-input-row">
                      <span className="player-input-label">
                        Player {index + 1}
                        {index === 0 ? ' (you)' : ''}
                      </span>
                      <input
                        type="text"
                        className="tournament-input"
                        value={name}
                        onChange={(e) => {
                          const updated = [...playerNames];
                          updated[index] = e.target.value;
                          setPlayerNames(updated);
                        }}
                        placeholder={index === 0 ? 'Your name' : 'Optional player name'}
                        disabled={index === 0}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {joinFormError && (
              <p className="lobby-rules-text" style={{ color: 'var(--error-color, #f44336)' }}>
                {joinFormError}
              </p>
            )}

            <div className="tournament-actions" style={{ marginTop: '1rem' }}>
              <button
                className="tournament-join-button"
                type="button"
                onClick={handleSubmitJoin}
                disabled={joinTournamentMutation.isPending}
              >
                {joinTournamentMutation.isPending ? 'Joining...' : 'Confirm Join'}
              </button>
              <button
                className="tournament-join-button tournament-joined-button"
                type="button"
                onClick={closeJoinModal}
                disabled={joinTournamentMutation.isPending}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Lobby Rules Modal (same structure as Lobby page) */}
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

      {/* Update Room Modal */}
      {showUpdateRoomModal && updatingRoomTournament && (
        <UpdateRoom
          isOpen={showUpdateRoomModal}
          tournament={updatingRoomTournament}
          onClose={handleCloseUpdateRoom}
          onUpdate={handleSubmitRoomUpdate}
          isUpdating={updateHostRoomMutation.isPending}
        />
      )}
    </div>
  );
};

export default UserTournaments;

