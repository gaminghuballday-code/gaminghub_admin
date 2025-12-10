import { useState } from 'react';
import { useJoinedTournaments, useUpdateRoomForUser } from '@services/api/hooks';
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
  const [showUpdateRoomModal, setShowUpdateRoomModal] = useState(false);
  const [updatingRoomTournament, setUpdatingRoomTournament] = useState<Tournament | null>(null);

  // Check if user is host or admin for a tournament
  const canUpdateRoom = (tournament: Tournament): boolean => {
    if (!user) return false;
    const userId = user._id || user.userId;
    const tournamentHostId = tournament.hostId;
    const isHost = tournamentHostId && (tournamentHostId === userId);
    const isAdmin = user.role === 'admin';
    return isHost || isAdmin;
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

