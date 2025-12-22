import type { FC } from 'react';
import type { Host } from '@services/api';
import './AllHostsList.scss';

interface AllHostsListProps {
  hosts: Host[];
  hostsLoading: boolean;
  hostsError: string | null;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onHostClick: (host: Host) => void;
}

const AllHostsList: FC<AllHostsListProps> = ({
  hosts,
  hostsLoading,
  hostsError,
  pagination,
  onHostClick,
}) => {
  if (hostsLoading) {
    return (
      <div className="all-hosts-list">
        <div className="all-hosts-loading">
          <p>Loading hosts...</p>
        </div>
      </div>
    );
  }

  if (hostsError) {
    return (
      <div className="all-hosts-list">
        <div className="all-hosts-error">
          <p>{hostsError}</p>
        </div>
      </div>
    );
  }

  if (hosts.length === 0) {
    return (
      <div className="all-hosts-list">
        <div className="all-hosts-empty">
          <p>No hosts found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="all-hosts-list">
      <div className="all-hosts-list-content">
        {hosts.map((host) => {
          const hostId = host.hostId || host._id || '';
          return (
            <div
              key={hostId}
              className="all-hosts-item"
              onClick={() => onHostClick(host)}
            >
              <div className="all-hosts-item-content">
                <div className="all-hosts-name">{host.name || 'N/A'}</div>
                <div className="all-hosts-email">{host.email}</div>
                {host.totalLobbies !== undefined && (
                  <div className="all-hosts-lobbies">
                    Total Lobbies: {host.totalLobbies}
                  </div>
                )}
              </div>
              <div className="all-hosts-item-arrow">→</div>
            </div>
          );
        })}
      </div>
      {pagination && (
        <div className="all-hosts-pagination">
          <div className="all-hosts-pagination-info">
            <span className="all-hosts-pagination-text">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            {pagination.total > 0 && (
              <span className="all-hosts-pagination-total">
                (Showing {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} hosts)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AllHostsList;

