import type { FC } from 'react';
import type { AdminOrganization } from '@services/api/organizations.api';
import './AllOrgsList.scss';

interface AllOrgsListProps {
  organizations: AdminOrganization[];
  orgsLoading: boolean;
  orgsError: string | null;
  onOrgClick: (org: AdminOrganization) => void;
}

const AllOrgsList: FC<AllOrgsListProps> = ({
  organizations,
  orgsLoading,
  orgsError,
  onOrgClick,
}) => {
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
      <div className="all-orgs-list-content">
        {organizations.map((org) => (
          <div
            key={org.id}
            className="all-orgs-item"
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
            <div className="all-orgs-item-content">
              <div className="all-orgs-name">{org.name || 'N/A'}</div>
              <div className="all-orgs-id">ID: {org.id}</div>
              {org.ownerUserId && (
                <div className="all-orgs-owner">Owner user: {org.ownerUserId}</div>
              )}
            </div>
            <div className="all-orgs-item-arrow">→</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllOrgsList;
