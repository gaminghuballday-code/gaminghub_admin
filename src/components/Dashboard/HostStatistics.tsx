import React, { FC } from 'react';
import type { HostStatistics as HostStatisticsType } from '@services/api';
import './HostStatistics.scss';

interface HostStatisticsProps {
  hostStatistics: HostStatisticsType[];
  hostStatsLoading: boolean;
  hostStatsError: string | null;
  totalHosts: number;
  totalLobbies: number;
  hostStatsFilters: {
    fromDate?: string;
    toDate?: string;
    hostEmail?: string;
  };
  onFilterChange: (filterType: 'fromDate' | 'toDate' | 'hostEmail', value: string) => void;
  onClearFilters: () => void;
  onSearch: () => void;
}

const HostStatistics: FC<HostStatisticsProps> = ({
  hostStatistics,
  hostStatsLoading,
  hostStatsError,
  totalHosts,
  totalLobbies,
  hostStatsFilters,
  onFilterChange,
  onClearFilters,
  onSearch,
}) => {
  return (
    <div className="dashboard-card">
      <div className="card-header-with-filters">
        <h2 className="card-title">Host Statistics</h2>
        <div className="host-stats-summary">
          <span className="stat-item">Total Hosts: {totalHosts}</span>
          <span className="stat-item">Total Lobbies: {totalLobbies}</span>
        </div>
      </div>
      
      {/* Filters */}
      <div className="host-stats-filters">
        <div className="filter-group">
          <label className="filter-label">FROM DATE (YYYY-MM-DD)</label>
          <input
            type="date"
            className="filter-input"
            value={hostStatsFilters.fromDate || ''}
            onChange={(e) => onFilterChange('fromDate', e.target.value)}
            disabled={hostStatsLoading}
          />
        </div>
        <div className="filter-group">
          <label className="filter-label">TO DATE (YYYY-MM-DD)</label>
          <input
            type="date"
            className="filter-input"
            value={hostStatsFilters.toDate || ''}
            onChange={(e) => onFilterChange('toDate', e.target.value)}
            disabled={hostStatsLoading}
          />
        </div>
        <div className="filter-group">
          <label className="filter-label">HOST EMAIL</label>
          <input
            type="text"
            className="filter-input"
            placeholder="Enter host email"
            value={hostStatsFilters.hostEmail || ''}
            onChange={(e) => onFilterChange('hostEmail', e.target.value)}
            disabled={hostStatsLoading}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                onSearch();
              }
            }}
          />
        </div>
        <div className="filter-actions">
          <button
            className="search-filters-button"
            onClick={onSearch}
            disabled={hostStatsLoading}
          >
            {hostStatsLoading ? 'Searching...' : '🔍 SEARCH'}
          </button>
          <button
            className="clear-filters-button"
            onClick={onClearFilters}
            disabled={hostStatsLoading}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {hostStatsLoading ? (
        <div className="host-stats-loading">
          <p>Loading host statistics...</p>
        </div>
      ) : hostStatsError ? (
        <div className="host-stats-error">
          <p>{hostStatsError}</p>
        </div>
      ) : hostStatistics.length > 0 ? (
        <div className="host-stats-table-container">
          <table className="host-stats-table">
            <thead>
              <tr>
                <th>Host Name</th>
                <th>Email</th>
                <th>Host ID</th>
                <th>Total Lobbies</th>
                <th>Time Slot Summary</th>
                <th>Daily Records</th>
              </tr>
            </thead>
            <tbody>
              {hostStatistics.map((host) => (
                <tr key={host.hostId} className="host-stat-row">
                  <td className="host-stat-name-cell">
                    <strong>{host.name}</strong>
                  </td>
                  <td className="host-stat-email-cell">{host.email}</td>
                  <td className="host-stat-id-cell">
                    <code>{host.hostId}</code>
                  </td>
                  <td className="host-stat-total-cell">
                    <span className="total-value">{host.totalLobbies}</span>
                  </td>
                  <td className="host-stat-timeslots-cell">
                    {Object.keys(host.timeSlotSummary || {}).length > 0 ? (
                      <table className="timeslot-table">
                        <thead>
                          <tr>
                            <th>Time</th>
                            <th>Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(host.timeSlotSummary).map(([timeSlot, count]) => (
                            <tr key={timeSlot}>
                              <td className="timeslot-time">{timeSlot}</td>
                              <td className="timeslot-count">{count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <span className="no-data">No time slots</span>
                    )}
                  </td>
                  <td className="host-stat-daily-cell">
                    {host.dailyRecords && host.dailyRecords.length > 0 ? (
                      <table className="daily-records-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Lobbies</th>
                            <th>Tournaments</th>
                          </tr>
                        </thead>
                        <tbody>
                          {host.dailyRecords.map((record, idx) => (
                            <tr key={idx} className="daily-record-row">
                              <td className="daily-date">{record.date}</td>
                              <td className="daily-lobbies">{record.lobbies}</td>
                              <td className="daily-tournaments-cell">
                                {record.tournaments && record.tournaments.length > 0 ? (
                                  <table className="tournament-table">
                                    <thead>
                                      <tr>
                                        <th>Game</th>
                                        <th>Time</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {record.tournaments.map((tournament, tIdx) => (
                                        <tr key={tIdx}>
                                          <td>{tournament.game || 'N/A'}</td>
                                          <td>{tournament.startTime}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                ) : (
                                  <span className="no-data">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <span className="no-data">No daily records</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="host-stats-empty">
          <p>No host statistics found.</p>
        </div>
      )}
    </div>
  );
};

export default HostStatistics;

