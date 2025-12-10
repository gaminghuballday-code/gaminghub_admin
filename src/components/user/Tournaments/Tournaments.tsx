import { useUserTournaments } from '@services/api/hooks';
import UserSidebar from '@components/user/common/UserSidebar';
import AppHeaderActions from '@components/common/AppHeaderActions';
import Loading from '@components/common/Loading';
import './Tournaments.scss';

const UserTournaments: React.FC = () => {
  const { data: tournaments = [], isLoading, error } = useUserTournaments();

  return (
    <div className="user-tournaments-container">
      <UserSidebar />

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

