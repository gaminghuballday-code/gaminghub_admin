import type { FC, FormEvent } from 'react';
import type { AdminUser, PaginationInfo } from '@services/api';
import { getAdminUserId } from '@utils/privilegedAccount.helper';
import './AllInfluencersList.scss';

interface AllInfluencersListProps {
  influencers: AdminUser[];
  influencersLoading: boolean;
  influencersError: string | null;
  pagination?: PaginationInfo;
  listPage: number;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearchSubmit: (e: FormEvent) => void;
  onPageChange: (page: number) => void;
  privilegedAccountActions: boolean;
  selectedUserIds: Set<string>;
  onToggleSelect: (userId: string, selected: boolean) => void;
  onSelectAllOnPage: (selected: boolean) => void;
  onRequestDelete: (userId: string) => void;
  onRequestBlock: (userId: string) => void;
  onRequestUnblock: (userId: string) => void;
  onBulkDeleteSelected: () => void;
  actionPending: boolean;
}

const AllInfluencersList: FC<AllInfluencersListProps> = ({
  influencers,
  influencersLoading,
  influencersError,
  pagination,
  listPage,
  searchInput,
  onSearchInputChange,
  onSearchSubmit,
  onPageChange,
  privilegedAccountActions,
  selectedUserIds,
  onToggleSelect,
  onSelectAllOnPage,
  onRequestDelete,
  onRequestBlock,
  onRequestUnblock,
  onBulkDeleteSelected,
  actionPending,
}) => {
  const pageUserIds = influencers
    .map((u) => getAdminUserId(u))
    .filter((id): id is string => Boolean(id));
  const allOnPageSelected =
    pageUserIds.length > 0 && pageUserIds.every((id) => selectedUserIds.has(id));

  return (
    <div className="all-influencers-list">
      <form className="all-influencers-list__toolbar" onSubmit={onSearchSubmit}>
        <label className="all-influencers-list__search-label" htmlFor="influencer-search">
          Search
        </label>
        <div className="all-influencers-list__search-row">
          <input
            id="influencer-search"
            type="search"
            className="all-influencers-list__search-input"
            placeholder="Name or email"
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            autoComplete="off"
          />
          <button type="submit" className="all-influencers-list__search-btn">
            Search
          </button>
        </div>
      </form>

      {privilegedAccountActions && selectedUserIds.size > 0 && !influencersLoading ? (
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

      {influencersLoading ? (
        <div className="all-influencers-list__state">
          <p>Loading influencers...</p>
        </div>
      ) : null}

      {!influencersLoading && influencersError ? (
        <div className="all-influencers-list__state all-influencers-list__state--error">
          <p>{influencersError}</p>
        </div>
      ) : null}

      {!influencersLoading && !influencersError && influencers.length === 0 ? (
        <div className="all-influencers-list__state">
          <p>No influencers found.</p>
        </div>
      ) : null}

      {!influencersLoading && !influencersError && influencers.length > 0 ? (
        <>
          {privilegedAccountActions ? (
            <div className="account-list-select-all">
              <label className="account-list-select-all__label">
                <input
                  type="checkbox"
                  checked={allOnPageSelected}
                  disabled={actionPending || pageUserIds.length === 0}
                  onChange={(e) => onSelectAllOnPage(e.target.checked)}
                />
                <span>Select all on this page</span>
              </label>
            </div>
          ) : null}

          <div className="all-influencers-list__content">
            {influencers.map((user) => {
              const rowKey = getAdminUserId(user) || user.email;
              const userId = getAdminUserId(user);
              const blocked = user.isBlocked === true;
              const canAct = privilegedAccountActions && userId;

              return (
                <div key={rowKey} className="all-influencers-list__item">
                  {privilegedAccountActions ? (
                    <div className="all-influencers-list__check">
                      <input
                        type="checkbox"
                        checked={userId ? selectedUserIds.has(userId) : false}
                        disabled={!userId || actionPending}
                        onChange={(e) => userId && onToggleSelect(userId, e.target.checked)}
                        aria-label={`Select ${user.name || user.email}`}
                      />
                    </div>
                  ) : null}

                  <div className="all-influencers-list__item-main">
                    <div className="all-influencers-list__name">{user.name || '—'}</div>
                    <div className="all-influencers-list__email">{user.email}</div>
                    {user.createdAt ? (
                      <div className="all-influencers-list__meta">
                        Joined{' '}
                        {new Date(user.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        })}
                      </div>
                    ) : null}
                  </div>

                  {privilegedAccountActions ? (
                    <div className="all-influencers-list__actions">
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
                        <span className="account-row-btn--muted" title="Missing user id">
                          —
                        </span>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          {pagination && pagination.totalPages > 0 ? (
            <div className="all-influencers-list__pagination">
              <div className="all-influencers-list__pagination-info">
                <span className="all-influencers-list__pagination-text">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                {pagination.total > 0 ? (
                  <span className="all-influencers-list__pagination-total">
                    (Showing {(pagination.page - 1) * pagination.limit + 1}-
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} influencers)
                  </span>
                ) : null}
              </div>
              <div className="all-influencers-list__pagination-nav">
                <button
                  type="button"
                  className="all-influencers-list__page-btn"
                  onClick={() => onPageChange(listPage - 1)}
                  disabled={listPage <= 1 || influencersLoading}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="all-influencers-list__page-btn"
                  onClick={() => onPageChange(listPage + 1)}
                  disabled={
                    !pagination || listPage >= pagination.totalPages || influencersLoading
                  }
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
};

export default AllInfluencersList;
