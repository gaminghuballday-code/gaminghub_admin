import type { FC } from 'react';
import type { Host } from '@services/api';
import { getHostAccountUserId } from '@utils/privilegedAccount.helper';
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
  privilegedAccountActions: boolean;
  selectedUserIds: Set<string>;
  onToggleSelect: (userId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onRequestDelete: (userId: string) => void;
  onRequestBlock: (userId: string) => void;
  onRequestUnblock: (userId: string) => void;
  onBulkDeleteSelected: () => void;
  actionPending: boolean;
}

const AllHostsList: FC<AllHostsListProps> = ({
  hosts,
  hostsLoading,
  hostsError,
  pagination,
  onHostClick,
  privilegedAccountActions,
  selectedUserIds,
  onToggleSelect,
  onSelectAll,
  onRequestDelete,
  onRequestBlock,
  onRequestUnblock,
  onBulkDeleteSelected,
  actionPending,
}) => {
  const hostUserIds = hosts
    .map((h) => getHostAccountUserId(h))
    .filter((id): id is string => Boolean(id));
  const allOnPageSelected =
    hostUserIds.length > 0 && hostUserIds.every((id) => selectedUserIds.has(id));

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
      {privilegedAccountActions && selectedUserIds.size > 0 ? (
        <div className="account-list-bulk-bar">
          <span className="account-list-bulk-bar__count">{selectedUserIds.size} selected</span>
          <button
            type="button"
            className="account-list-bulk-bar__btn account-list-bulk-bar__btn--danger"
            disabled={actionPending}
            onClick={onBulkDeleteSelected}
          >
            Delete selected
          </button>
        </div>
      ) : null}

      {privilegedAccountActions && hosts.length > 0 ? (
        <div className="account-list-select-all">
          <label className="account-list-select-all__label">
            <input
              type="checkbox"
              checked={allOnPageSelected}
              disabled={actionPending || hostUserIds.length === 0}
              onChange={(e) => onSelectAll(e.target.checked)}
            />
            <span>Select all on this page</span>
          </label>
        </div>
      ) : null}

      <div className="all-hosts-list-content">
        {hosts.map((host) => {
          const rowKey = host.hostId || host._id || '';
          const userId = getHostAccountUserId(host);
          const blocked = host.isBlocked === true;
          const canAct = privilegedAccountActions && userId;

          return (
            <div key={rowKey} className="all-hosts-item">
              {privilegedAccountActions ? (
                <div
                  className="all-hosts-item__check"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={userId ? selectedUserIds.has(userId) : false}
                    disabled={!userId || actionPending}
                    onChange={(e) => userId && onToggleSelect(userId, e.target.checked)}
                    aria-label={`Select ${host.name || host.email}`}
                  />
                </div>
              ) : null}

              <div
                className="all-hosts-item-content"
                onClick={() => onHostClick(host)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onHostClick(host);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="all-hosts-name">{host.name || 'N/A'}</div>
                <div className="all-hosts-email">{host.email}</div>
                {host.totalLobbies !== undefined && (
                  <div className="all-hosts-lobbies">Total Lobbies: {host.totalLobbies}</div>
                )}
              </div>

              {privilegedAccountActions ? (
                <div
                  className="all-hosts-item-actions"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  {canAct ? (
                    <>
                      <button
                        type="button"
                        className="account-row-btn account-row-btn--danger"
                        disabled={actionPending}
                        onClick={() => userId && onRequestDelete(userId)}
                      >
                        Delete
                      </button>
                      {blocked ? (
                        <button
                          type="button"
                          className="account-row-btn"
                          disabled={actionPending}
                          onClick={() => userId && onRequestUnblock(userId)}
                        >
                          Unblock
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="account-row-btn"
                          disabled={actionPending}
                          onClick={() => userId && onRequestBlock(userId)}
                        >
                          Block
                        </button>
                      )}
                    </>
                  ) : (
                    <span className="account-row-btn--muted" title="Missing user id for this row">
                      —
                    </span>
                  )}
                </div>
              ) : (
                <div className="all-hosts-item-arrow">→</div>
              )}
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
                (Showing {((pagination.page - 1) * pagination.limit) + 1}-
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{' '}
                hosts)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AllHostsList;
