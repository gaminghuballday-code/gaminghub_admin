import type { FC } from 'react';
import type { AdminOrganization } from '@services/api';
import { getOrganizationOwnerSummary } from '@services/api';
import { getOrganizationOwnerUserId } from '@utils/privilegedAccount.helper';
import './AllOrgsList.scss';

interface AllOrgsListProps {
  organizations: AdminOrganization[];
  orgsLoading: boolean;
  orgsError: string | null;
  onOrgClick: (org: AdminOrganization) => void;
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

const AllOrgsList: FC<AllOrgsListProps> = ({
  organizations,
  orgsLoading,
  orgsError,
  onOrgClick,
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
  const ownerUserIds = organizations
    .map((o) => getOrganizationOwnerUserId(o))
    .filter((id): id is string => Boolean(id));
  const allOnPageSelected =
    ownerUserIds.length > 0 && ownerUserIds.every((id) => selectedUserIds.has(id));

  const ownerBlocked = (org: AdminOrganization): boolean => {
    const o = org.ownerUserId;
    return typeof o === 'object' && o !== null && o.isBlocked === true;
  };

  if (orgsLoading) {
    return (
      <div className="all-orgs-list">
        <div className="all-orgs-loading">
          <p>Loading organizations...</p>
        </div>
      </div>
    );
  }

  if (orgsError) {
    return (
      <div className="all-orgs-list">
        <div className="all-orgs-error">
          <p>{orgsError}</p>
        </div>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="all-orgs-list">
        <div className="all-orgs-empty">
          <p>No organizations found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="all-orgs-list">
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

      {privilegedAccountActions && organizations.length > 0 ? (
        <div className="account-list-select-all">
          <label className="account-list-select-all__label">
            <input
              type="checkbox"
              checked={allOnPageSelected}
              disabled={actionPending || ownerUserIds.length === 0}
              onChange={(e) => onSelectAll(e.target.checked)}
            />
            <span>Select all on this page</span>
          </label>
        </div>
      ) : null}

      <div className="all-orgs-list-content">
        {organizations.map((org) => {
          const ownerSummary = getOrganizationOwnerSummary(org);
          const userId = getOrganizationOwnerUserId(org);
          const canAct = privilegedAccountActions && userId;
          const blocked = ownerBlocked(org);

          return (
            <div key={org.id} className="all-orgs-item">
              {privilegedAccountActions ? (
                <div
                  className="all-orgs-item__check"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={userId ? selectedUserIds.has(userId) : false}
                    disabled={!userId || actionPending}
                    onChange={(e) => userId && onToggleSelect(userId, e.target.checked)}
                    aria-label={`Select ${org.name || 'organization'}`}
                  />
                </div>
              ) : null}

              <div
                className="all-orgs-item-content"
                onClick={() => onOrgClick(org)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOrgClick(org);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="all-orgs-name">{org.name || 'N/A'}</div>
                <div className="all-orgs-id">ID: {org.id}</div>
                {ownerSummary ? <div className="all-orgs-owner">Owner: {ownerSummary}</div> : null}
              </div>

              {privilegedAccountActions ? (
                <div
                  className="all-orgs-item-actions"
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
                    <span className="account-row-btn--muted" title="Owner user id not available">
                      —
                    </span>
                  )}
                </div>
              ) : (
                <div className="all-orgs-item-arrow">→</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AllOrgsList;
