import { useState } from 'react';
import { useWalletHistory } from '@services/api/hooks';
import UserSidebar from '@components/user/common/UserSidebar';
import AppHeaderActions from '@components/common/AppHeaderActions';
import Loading from '@components/common/Loading';
import { useSidebarSync } from '@hooks/useSidebarSync';
import './History.scss';

const UserHistory: React.FC = () => {
  const { data: history = [], isLoading, error } = useWalletHistory({ limit: 50, skip: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useSidebarSync(sidebarOpen);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatDateTime = (dateString?: string, timeString?: string) => {
    if (!dateString) return 'N/A';
    const time = timeString || '';
    return `${formatDate(dateString)} ${time}`;
  };

  const formatTimestamp = (timestamp?: string, fallbackDate?: string, fallbackTime?: string) => {
    if (timestamp) {
      return new Date(timestamp).toLocaleString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return formatDateTime(fallbackDate, fallbackTime);
  };

  return (
    <div className="user-history-container">
      <UserSidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

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
                      <th>Status</th>
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
                        const dateTime = formatTimestamp(
                          (item as any).timestamp || item.createdAt,
                          tournament?.date || item.date,
                          tournament?.startTime || item.time
                        );
                        const rawAmount = item.winnings ?? (item as any).amountGC ?? 0;
                        const type = (item as any).type;
                        // For join/deduction show negative, others as positive
                        const winnings = type === 'join' || type === 'deduction' ? -Math.abs(rawAmount) : Math.abs(rawAmount);
                        const description = (item as any).description;

                        const getTypeLabel = (value?: string) => {
                          if (!value) return '';
                          const normalized = value.toLowerCase();
                          if (normalized === 'topup') return 'Top Up';
                          if (normalized === 'deduction') return 'Deduction';
                          if (normalized === 'refund') return 'Refund';
                          if (normalized === 'join') return 'Join';
                          return value.charAt(0).toUpperCase() + value.slice(1);
                        };

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
                            <td className="status-cell">
                              {type ? (
                                <div className="status-info">
                                  <span className={`type-badge type-${type.toLowerCase()}`}>{getTypeLabel(type)}</span>
                                  {description && (
                                    <div className="status-info-icon">
                                      <span className="info-icon">i</span>
                                      <div className="status-info-tooltip">
                                        {description}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="status-placeholder">-</span>
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

