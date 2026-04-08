import { useMemo, useState, type FC } from 'react';
import type { HostStatistics as HostStatisticsType } from '@services/api';
import { useHostStatistics } from '@services/api/hooks';
import { Modal } from '@components/common/Modal';
import NoDataFound from '@components/common/NoDataFound';
import './HostStatistics.scss';

interface HostStatisticsProps {
  hostStatistics: HostStatisticsType[];
  hostStatsLoading: boolean;
  hostStatsError: string | null;
  totalHosts: number;
  totalLobbies: number;
  totalHostFeeEarned: number;
  allHostsLifetimeHostFeeEarned: number;
  hostStatsFilters: {
    fromDate?: string;
    toDate?: string;
    hostEmail?: string;
  };
  currentPage: number;
  totalPages: number;
  onFilterChange: (filterType: 'fromDate' | 'toDate' | 'hostEmail', value: string) => void;
  onClearFilters: () => void;
  onSearch: () => void;
  onPageChange: (page: number) => void;
}

const HostStatistics: FC<HostStatisticsProps> = ({
  hostStatistics,
  hostStatsLoading,
  hostStatsError,
  totalHosts,
  totalLobbies,
  totalHostFeeEarned,
  allHostsLifetimeHostFeeEarned,
  hostStatsFilters,
  currentPage,
  totalPages,
  onFilterChange,
  onClearFilters,
  onSearch,
  onPageChange,
}) => {
  const [selectedHost, setSelectedHost] = useState<HostStatisticsType | null>(null);
  const [isDailyRecordsModalOpen, setIsDailyRecordsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [queriedDate, setQueriedDate] = useState<string>('');
  const [modalDailyRecords, setModalDailyRecords] = useState<HostStatisticsType['dailyRecords']>([]);

  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleOpenDailyRecordsModal = (host: HostStatisticsType) => {
    setSelectedHost(host);
    setSelectedDate(getCurrentDate());
    setQueriedDate('');
    // Keep a stable snapshot to avoid UI flicker/disappearing data on background refetches.
    setModalDailyRecords(Array.isArray(host.dailyRecords) ? host.dailyRecords : []);
    setIsDailyRecordsModalOpen(true);
  };

  const handleCloseDailyRecordsModal = () => {
    setIsDailyRecordsModalOpen(false);
    setSelectedHost(null);
    setSelectedDate('');
    setQueriedDate('');
    setModalDailyRecords([]);
  };

  const filteredDailyRecords = useMemo(() => {
    if (!Array.isArray(modalDailyRecords) || modalDailyRecords.length === 0) {
      return [];
    }
    if (!queriedDate) {
      return modalDailyRecords;
    }
    return modalDailyRecords.filter((record) => record.date === queriedDate);
  }, [modalDailyRecords, queriedDate]);

  const {
    data: selectedHostDateData,
    isLoading: selectedHostDateLoading,
    isFetched: selectedHostDateFetched,
  } = useHostStatistics(
    queriedDate && selectedHost?.email
      ? {
          date: queriedDate,
          hostEmail: selectedHost.email,
        }
      : undefined,
    Boolean(isDailyRecordsModalOpen && queriedDate && selectedHost?.email)
  );

  const selectedHostDateRecords = useMemo(() => {
    const fallbackRecords = filteredDailyRecords;

    if (!queriedDate) {
      return fallbackRecords;
    }

    const apiHost = selectedHostDateData?.hosts?.find(
      (host) => host.hostId === selectedHost?.hostId || host.email === selectedHost?.email
    );

    // Keep existing records visible while date query is loading to avoid flicker/disappearing UI.
    if (selectedHostDateLoading && !selectedHostDateFetched) {
      return fallbackRecords;
    }

    if (!apiHost || !Array.isArray(apiHost.dailyRecords)) {
      return [];
    }

    return apiHost.dailyRecords;
  }, [
    filteredDailyRecords,
    queriedDate,
    selectedHost,
    selectedHostDateData,
    selectedHostDateFetched,
    selectedHostDateLoading,
  ]);

  const formatCurrency = (value?: number) => {
    const safeValue = Number.isFinite(value) ? Number(value) : 0;
    return `₹${safeValue.toLocaleString('en-IN')}`;
  };

  const totalAllHostsEarned = allHostsLifetimeHostFeeEarned || totalHostFeeEarned;

  const getDailyLobbyCount = (record: HostStatisticsType['dailyRecords'][number]) => {
    if (typeof record.lobbies === 'number' && record.lobbies > 0) {
      return record.lobbies;
    }
    if (Array.isArray(record.tournaments)) {
      return record.tournaments.length;
    }
    return 0;
  };

  return (
    <div className="dashboard-card">
      <div className="card-header-with-filters">
        <h2 className="card-title">Host Statistics</h2>
        <div className="host-stats-summary">
          <span className="stat-item">Total Hosts: {totalHosts}</span>
          <span className="stat-item">Total Lobbies: {totalLobbies}</span>
          <span className="stat-item">Total Host Earned: {formatCurrency(totalAllHostsEarned)}</span>
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
                <th>Lifetime Host Earned</th>
                <th>Total Lobbies</th>
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
                  <td className="host-stat-earned-cell">
                    <span className="earned-value">
                      {formatCurrency(host.lifetimeHostFeeEarned || host.totalHostFeeEarned || 0)}
                    </span>
                  </td>
                  <td className="host-stat-total-cell">
                    <span className="total-value">{host.totalLobbies}</span>
                  </td>
                  <td className="host-stat-daily-cell">
                    {host.dailyRecords && host.dailyRecords.length > 0 ? (
                      <div className="daily-records-preview">
                        <div className="daily-records-meta">
                          <span className="daily-records-count">{host.dailyRecords.length} day records</span>
                          <span className="daily-records-note">
                            Latest: {host.dailyRecords[0]?.date || 'N/A'}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="view-more-button"
                          onClick={() => handleOpenDailyRecordsModal(host)}
                        >
                          View More
                        </button>
                      </div>
                    ) : (
                      <span className="no-data">No daily records</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="pagination-controls">
              <button
                type="button"
                className="pagination-page-button"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1 || hostStatsLoading}
              >
                Prev
              </button>
              <span className="pagination-text">Page {currentPage} of {totalPages}</span>
              <button
                type="button"
                className="pagination-page-button"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages || hostStatsLoading}
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        <NoDataFound className="host-stats-empty" message="No host statistics found." />
      )}

      <Modal
        isOpen={isDailyRecordsModalOpen}
        onClose={handleCloseDailyRecordsModal}
        className="modal-large"
        title={`Daily Records - ${selectedHost?.name || 'Host'}`}
        showCloseButton={true}
      >
        <div className="daily-records-modal">
          <div className="daily-records-modal__filters">
            <label className="filter-label" htmlFor="daily-record-date-filter">
              DATE FILTER
            </label>
            <input
              id="daily-record-date-filter"
              type="date"
              className="filter-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <button
              type="button"
              className="search-filters-button"
              onClick={() => setQueriedDate(selectedDate)}
              disabled={!selectedDate}
            >
              Show Data
            </button>
            <button
              type="button"
              className="clear-filters-button"
              onClick={() => {
                setSelectedDate('');
                setQueriedDate('');
              }}
            >
              Show All Dates
            </button>
          </div>

          {selectedHostDateRecords.length === 0 && queriedDate && !selectedHostDateLoading ? (
            <NoDataFound className="host-stats-empty" message="No lobby for the day." />
          ) : queriedDate && selectedHostDateLoading ? (
            <div className="host-stats-loading">
              <p>Checking selected date...</p>
            </div>
          ) : (
            <div className="daily-records-modal__list">
              {selectedHostDateRecords.map((record, idx) => (
                <div key={`${record.date}-${idx}`} className="daily-record-card">
                  <div className="daily-record-card__header">
                    <span className="daily-date">{record.date || 'Unknown date'}</span>
                    <span className="daily-lobbies">{getDailyLobbyCount(record)} lobbies</span>
                  </div>
                  <div className="daily-record-card__body">
                    {record.tournaments && record.tournaments.length > 0 ? (
                      <table className="tournament-table">
                        <thead>
                          <tr>
                            <th>Game</th>
                            <th>Mode</th>
                            <th>Start Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {record.tournaments.map((tournament, tIdx) => (
                            <tr key={`${record.date}-${tIdx}`}>
                              <td>{tournament.game || 'N/A'}</td>
                              <td>{tournament.mode || 'N/A'}</td>
                              <td>{tournament.startTime || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <span className="no-data">No tournaments</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default HostStatistics;

