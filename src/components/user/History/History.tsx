import { useWalletHistory } from '@services/api/hooks';
import UserSidebar from '@components/user/common/UserSidebar';
import AppHeaderActions from '@components/common/AppHeaderActions';
import Loading from '@components/common/Loading';
import './History.scss';

const UserHistory: React.FC = () => {
  const { data: history = [], isLoading, error } = useWalletHistory({ limit: 50, skip: 0 });

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  const formatDateTime = (dateString?: string, timeString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const time = timeString || '';
    return `${formatDate(dateString)} ${time}`;
  };

  return (
    <div className="user-history-container">
      <UserSidebar />

      <main className="user-main">
        <header className="user-header">
          <h1>History</h1>
          <AppHeaderActions />
        </header>

        <div className="user-content">
          <div className="history-card">
            <h2 className="card-title">Your History</h2>
            
            {isLoading ? (
              <div className="history-loading">
                <Loading />
                <p>Loading your history...</p>
              </div>
            ) : error ? (
              <div className="history-error">
                <p>Error loading history. Please try again later.</p>
              </div>
            ) : history.length > 0 ? (
              <div className="history-table-container">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Tournament</th>
                      <th>Date & Time</th>
                      <th>Winnings (GC)</th>
                      <th>Rank</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history
                      .sort((a, b) => new Date(b.createdAt || b.date || '').getTime() - new Date(a.createdAt || a.date || '').getTime())
                      .map((item) => {
                        const tournament = item.tournament;
                        const gameMode = tournament 
                          ? `${tournament.game} - ${tournament.mode} ${tournament.subMode ? `(${tournament.subMode})` : ''}`
                          : 'Tournament';
                        const dateTime = formatDateTime(tournament?.date || item.date, tournament?.startTime || item.time);
                        const winnings = item.winnings || 0;
                        const rank = item.rank;

                        return (
                          <tr key={item._id}>
                            <td className="tournament-cell">
                              <div className="tournament-info">
                                <span className="tournament-name">{gameMode}</span>
                                {tournament && (
                                  <span className="tournament-prize">Prize Pool: ₹{tournament.prizePool}</span>
                                )}
                              </div>
                            </td>
                            <td className="datetime-cell">{dateTime}</td>
                            <td className={`winnings-cell ${winnings > 0 ? 'positive' : ''}`}>
                              {winnings > 0 ? `+${winnings}` : winnings} GC
                            </td>
                            <td className="rank-cell">
                              {rank ? (
                                <span className={`rank-badge rank-${rank <= 3 ? 'top' : 'normal'}`}>
                                  #{rank}
                                </span>
                              ) : (
                                <span className="rank-badge">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="card-content">No tournament history available.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserHistory;

