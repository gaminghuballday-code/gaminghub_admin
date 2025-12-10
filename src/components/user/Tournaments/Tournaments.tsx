import { useState } from 'react';
import { useUserTournaments, useJoinTournament, useJoinedTournaments } from '@services/api/hooks';
import { useAppSelector } from '@store/hooks';
import { selectUser } from '@store/slices/authSlice';
import UserSidebar from '@components/user/common/UserSidebar';
import AppHeaderActions from '@components/common/AppHeaderActions';
import Loading from '@components/common/Loading';
import Toaster from '@components/common/Toaster';
import './Tournaments.scss';

const UserTournaments: React.FC = () => {
  const { data: tournaments = [], isLoading, error } = useUserTournaments();
  const { data: joinedTournaments = [], refetch: refetchJoined } = useJoinedTournaments();
  const user = useAppSelector(selectUser);
  const joinTournamentMutation = useJoinTournament();
  const [joiningTournamentId, setJoiningTournamentId] = useState<string | null>(null);

  // Check if user is host - hosts should not see join button
  const isHost = user?.role === 'host';

  // Create a Set of joined tournament IDs for quick lookup
  const joinedTournamentIds = new Set(
    joinedTournaments.map((t) => t._id || t.id).filter(Boolean) as string[]
  );

  const handleJoinTournament = async (tournamentId: string) => {
    if (joinedTournamentIds.has(tournamentId)) {
      return; // Already joined
    }

    setJoiningTournamentId(tournamentId);
    try {
      await joinTournamentMutation.mutateAsync({ tournamentId });
      await refetchJoined();
      // Show success message via Toaster (if available)
    } catch (error: any) {
      console.error('Failed to join tournament:', error);
      // Error will be handled by Toaster
    } finally {
      setJoiningTournamentId(null);
    }
  };

  const isJoining = (tournamentId: string) => joiningTournamentId === tournamentId;
  const isJoined = (tournamentId: string) => joinedTournamentIds.has(tournamentId);

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
                      <div className="tournament-detail-item">
                        <span className="detail-label">Entry Fee:</span>
                        <span className="detail-value">₹{tournament.entryFee}</span>
                      </div>
                      <div className="tournament-detail-item">
                        <span className="detail-label">Prize Pool:</span>
                        <span className="detail-value prize-pool">₹{tournament.prizePool}</span>
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
                    {!isHost && (
                      <div className="tournament-actions">
                        {isJoined(tournament._id || tournament.id || '') ? (
                          <button className="tournament-join-button tournament-joined-button" disabled>
                            Joined
                          </button>
                        ) : (
                          <button
                            className="tournament-join-button"
                            onClick={() => handleJoinTournament(tournament._id || tournament.id || '')}
                            disabled={isJoining(tournament._id || tournament.id || '')}
                          >
                            {isJoining(tournament._id || tournament.id || '') ? 'Joining...' : 'Join'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="card-content">No tournaments available at the moment.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserTournaments;

