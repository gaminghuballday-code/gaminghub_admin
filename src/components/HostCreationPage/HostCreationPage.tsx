import { useEffect } from 'react';
import { useHostCreationPageLogic } from './HostCreationPage.logic';
import { useOrgAccountSectionLogic } from './OrgAccountSection.logic';
import { useInfluencerAccountSectionLogic } from './InfluencerAccountSection.logic';
import { useHostCreationPrivilegedActions } from './HostCreationPage.privilegedActions.logic';
import AdminLayout from '@components/common/AdminLayout';
import ConfirmationModal from '@components/common/ConfirmationModal';
import { Modal } from '@components/common/Modal';
import NoDataFound from '@components/common/NoDataFound';
import AllHostsList from './AllHostsList';
import AllOrgsList from './AllOrgsList';
import AllInfluencersList from './AllInfluencersList';
import {
  HOST_ACCOUNT_ROLE_LABEL,
  HOST_DETAILS_NO_STATISTICS_MESSAGE,
  ORG_ACCOUNT_OWNER_ROLE_LABEL,
  ORG_DETAILS_NO_TOURNAMENTS_MESSAGE,
  ROUTES,
} from '@utils/constants';
import { getOrganizationOwnerEmail } from '@services/api';
import {
  getAdminUserId,
  getHostAccountUserId,
  getOrganizationOwnerUserId,
} from '@utils/privilegedAccount.helper';
import type { OrgTournamentStatusFilter } from '@services/api';
import { useLocation, matchPath } from 'react-router-dom';
import './HostCreationPage.scss';

const ORG_TOURNAMENT_STATUS_OPTIONS: Array<{ value: OrgTournamentStatusFilter | ''; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'locked', label: 'Locked' },
  { value: 'running', label: 'Running' },
  { value: 'result_pending', label: 'Result pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'result_published', label: 'Result published' },
  { value: 'cancelled', label: 'Cancelled' },
];

const HostCreationPage: React.FC = () => {
  const location = useLocation();
  const isHostSection =
    matchPath({ path: ROUTES.HOST_CREATION, end: true }, location.pathname) !== null;
  const isOrgSection =
    matchPath({ path: ROUTES.ORG_CREATION, end: true }, location.pathname) !== null;
  const isInfluencerSection =
    matchPath({ path: ROUTES.INFLUENCER_CREATION, end: true }, location.pathname) !== null;
  const {
    activeTab,
    setActiveTab,
    hostEmail,
    hostName,
    hostPassword,
    showPassword,
    createLoading,
    createError,
    createSuccess,
    setHostEmail,
    setHostName,
    setHostPassword,
    toggleShowPassword,
    handleCreateHost,
    hosts,
    hostsLoading,
    hostsError,
    pagination,
    selectedHost,
    hostStatistics,
    statsLoading,
    showHostModal,
    handleHostClick,
    handleCloseModal,
  } = useHostCreationPageLogic(isHostSection);

  const {
    orgTab,
    setOrgTab,
    orgName,
    setOrgName,
    ownerEmail,
    setOwnerEmail,
    logoFieldKey,
    logoPreviewUrl,
    handleLogoFileChange,
    clearLogoSelection,
    createLoading: orgCreateLoading,
    uploadPhase,
    createError: orgCreateError,
    createSuccess: orgCreateSuccess,
    handleCreateOrganization,
    organizations,
    orgsLoading,
    orgsError,
    selectedOrg,
    showOrgModal,
    tournamentStatus,
    setTournamentStatus,
    tournaments,
    tournamentsLoading,
    tournamentsError,
    handleOrgClick,
    handleCloseOrgModal,
  } = useOrgAccountSectionLogic(isOrgSection);

  const {
    privilegedAccountActions,
    hostSelectedIds,
    orgSelectedIds,
    influencerSelectedIds,
    setHostSelectedIds,
    setOrgSelectedIds,
    setInfluencerSelectedIds,
    toggleHostSelect,
    toggleOrgSelect,
    toggleInfluencerSelect,
    clearInfluencerSelection,
    setDeletePending,
    setBlockPending,
    deletePending,
    blockPending,
    confirmDelete,
    confirmBlock,
    actionPending,
  } = useHostCreationPrivilegedActions();

  const {
    influencerTab,
    setInfluencerTab,
    inviteEmail,
    setInviteEmail,
    inviteName,
    setInviteName,
    inviteReferralCode,
    setInviteReferralCode,
    isReferralCodeInvalid,
    createLoading: influencerInviteLoading,
    createError: influencerCreateError,
    createSuccess: influencerCreateSuccess,
    handleInviteInfluencer,
    influencers,
    influencersLoading,
    influencersError,
    pagination: influencersPagination,
    listPage: influencersListPage,
    searchInput: influencerSearchInput,
    setSearchInput: setInfluencerSearchInput,
    appliedSearch: influencerAppliedSearch,
    handleSearchSubmit: handleInfluencerSearchSubmit,
    handlePageChange: handleInfluencerPageChange,
  } = useInfluencerAccountSectionLogic(isInfluencerSection, privilegedAccountActions);

  useEffect(() => {
    clearInfluencerSelection();
  }, [influencersListPage, influencerAppliedSearch, clearInfluencerSelection]);

  const handleSelectAllHosts = (selected: boolean) => {
    const ids = hosts.map(getHostAccountUserId).filter((id): id is string => Boolean(id));
    setHostSelectedIds(selected ? new Set(ids) : new Set());
  };

  const handleSelectAllOrgs = (selected: boolean) => {
    const ids = organizations
      .map(getOrganizationOwnerUserId)
      .filter((id): id is string => Boolean(id));
    setOrgSelectedIds(selected ? new Set(ids) : new Set());
  };

  const handleSelectAllInfluencersOnPage = (selected: boolean) => {
    const ids = influencers.map(getAdminUserId).filter((id): id is string => Boolean(id));
    setInfluencerSelectedIds(selected ? new Set(ids) : new Set());
  };

  const handleInfluencerPageChangeWithClear = (nextPage: number) => {
    clearInfluencerSelection();
    handleInfluencerPageChange(nextPage);
  };

  const handleInfluencerSearchSubmitWithClear = (e: React.FormEvent) => {
    clearInfluencerSelection();
    handleInfluencerSearchSubmit(e);
  };

  return (
    <AdminLayout title="Account Creation">
      <div className="host-creation-content-wrapper">
        {isHostSection && (
          <>
            {/* Host Tabs */}
            <div className="host-creation-tabs">
              <button
                className={`host-tab ${activeTab === 'create' ? 'active' : ''}`}
                onClick={() => setActiveTab('create')}
                type="button"
              >
                Create Host
              </button>
              <button
                className={`host-tab ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
                type="button"
              >
                All Hosts
              </button>
            </div>

            {/* Create Host Tab */}
            {activeTab === 'create' && (
              <div className="host-creation-card">
                <h2 className="card-title">Create New Host Account</h2>
                <form className="host-creation-form" onSubmit={handleCreateHost}>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="host@example.com"
                      value={hostEmail}
                      onChange={(e) => setHostEmail(e.target.value)}
                      disabled={createLoading}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Host Name"
                      value={hostName}
                      onChange={(e) => setHostName(e.target.value)}
                      disabled={createLoading}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-input password-input"
                        placeholder="password123"
                        value={hostPassword}
                        onChange={(e) => setHostPassword(e.target.value)}
                        disabled={createLoading}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={toggleShowPassword}
                        disabled={createLoading}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  {createError && (
                    <div className="host-creation-error">
                      {createError}
                    </div>
                  )}
                  {createSuccess && (
                    <div className="host-creation-success">
                      {createSuccess}
                    </div>
                  )}
                  <button
                    type="submit"
                    className="host-creation-button"
                    disabled={createLoading || !hostEmail.trim() || !hostName.trim() || !hostPassword.trim()}
                  >
                    {createLoading ? 'Creating...' : 'Create Host Account'}
                  </button>
                </form>
              </div>
            )}

            {/* All Hosts Tab */}
            {activeTab === 'all' && (
              <div className="host-creation-card">
                <h2 className="card-title">All Hosts</h2>
                <AllHostsList
                  hosts={hosts}
                  hostsLoading={hostsLoading}
                  hostsError={hostsError}
                  pagination={pagination}
                  onHostClick={handleHostClick}
                  privilegedAccountActions={privilegedAccountActions}
                  selectedUserIds={hostSelectedIds}
                  onToggleSelect={toggleHostSelect}
                  onSelectAll={handleSelectAllHosts}
                  onRequestDelete={(userId) =>
                    setDeletePending({ context: 'host', ids: [userId] })
                  }
                  onRequestBlock={(userId) => setBlockPending({ ids: [userId], unblock: false })}
                  onRequestUnblock={(userId) => setBlockPending({ ids: [userId], unblock: true })}
                  onBulkDeleteSelected={() => {
                    if (hostSelectedIds.size === 0) return;
                    setDeletePending({ context: 'host', ids: [...hostSelectedIds] });
                  }}
                  actionPending={actionPending}
                />
              </div>
            )}
          </>
        )}

        {isInfluencerSection && (
          <>
            <div className="host-creation-tabs">
              {privilegedAccountActions ? (
                <button
                  className={`host-tab ${influencerTab === 'invite' ? 'active' : ''}`}
                  onClick={() => setInfluencerTab('invite')}
                  type="button"
                >
                  Invite Influencer
                </button>
              ) : null}
              <button
                className={`host-tab ${influencerTab === 'all' ? 'active' : ''}`}
                onClick={() => setInfluencerTab('all')}
                type="button"
              >
                All Influencers
              </button>
            </div>

            {privilegedAccountActions && influencerTab === 'invite' && (
              <div className="host-creation-card">
                <h2 className="card-title">Invite Influencer</h2>
                <p className="influencer-invite-hint">
                  No password is set here. We send an email with an OTP so the influencer can complete
                  signup in the app (e.g. via verify OTP).
                </p>
                <form className="host-creation-form" onSubmit={handleInviteInfluencer}>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="influencer@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      disabled={influencerInviteLoading}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Display name"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      disabled={influencerInviteLoading}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Referral code (optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="ABCD_1234"
                      value={inviteReferralCode}
                      onChange={(e) => setInviteReferralCode(e.target.value)}
                      disabled={influencerInviteLoading}
                      minLength={8}
                      maxLength={16}
                    />
                    <small className="influencer-invite-hint">
                      Optional. Use 8-16 chars: letters, numbers, "_" or "-". Must be globally unique.
                    </small>
                  </div>
                  {isReferralCodeInvalid && (
                    <div className="host-creation-error">
                      Referral code format is invalid (8-16 chars, letters/numbers/"_"/"-" only).
                    </div>
                  )}
                  {influencerCreateError && (
                    <div className="host-creation-error">{influencerCreateError}</div>
                  )}
                  {influencerCreateSuccess && (
                    <div className="host-creation-success">{influencerCreateSuccess}</div>
                  )}
                  <button
                    type="submit"
                    className="host-creation-button"
                    disabled={
                      influencerInviteLoading ||
                      !inviteEmail.trim() ||
                      !inviteName.trim() ||
                      isReferralCodeInvalid
                    }
                  >
                    {influencerInviteLoading ? 'Sending...' : 'Send invite'}
                  </button>
                </form>
              </div>
            )}

            {influencerTab === 'all' && (
              <div className="host-creation-card">
                <h2 className="card-title">All Influencers</h2>
                <AllInfluencersList
                  influencers={influencers}
                  influencersLoading={influencersLoading}
                  influencersError={influencersError}
                  pagination={influencersPagination}
                  listPage={influencersListPage}
                  searchInput={influencerSearchInput}
                  onSearchInputChange={setInfluencerSearchInput}
                  onSearchSubmit={handleInfluencerSearchSubmitWithClear}
                  onPageChange={handleInfluencerPageChangeWithClear}
                  privilegedAccountActions={privilegedAccountActions}
                  selectedUserIds={influencerSelectedIds}
                  onToggleSelect={toggleInfluencerSelect}
                  onSelectAllOnPage={handleSelectAllInfluencersOnPage}
                  onRequestDelete={(userId) =>
                    setDeletePending({ context: 'influencer', ids: [userId] })
                  }
                  onRequestBlock={(userId) => setBlockPending({ ids: [userId], unblock: false })}
                  onRequestUnblock={(userId) => setBlockPending({ ids: [userId], unblock: true })}
                  onBulkDeleteSelected={() => {
                    if (influencerSelectedIds.size === 0) return;
                    setDeletePending({
                      context: 'influencer',
                      ids: [...influencerSelectedIds],
                    });
                  }}
                  actionPending={actionPending}
                />
              </div>
            )}
          </>
        )}

        {isOrgSection && (
          <>
            <div className="host-creation-tabs">
              <button
                className={`host-tab ${orgTab === 'create' ? 'active' : ''}`}
                onClick={() => setOrgTab('create')}
                type="button"
              >
                Create Org
              </button>
              <button
                className={`host-tab ${orgTab === 'all' ? 'active' : ''}`}
                onClick={() => setOrgTab('all')}
                type="button"
              >
                All Orgs
              </button>
            </div>

            {orgTab === 'create' && (
              <div className="host-creation-card">
                <h2 className="card-title">Create New Organization</h2>
                <form className="host-creation-form" onSubmit={handleCreateOrganization}>
                  <div className="form-group org-logo-upload">
                    <span className="form-label">Organization logo</span>
                    <p className="org-logo-upload__hint">PNG, JPG, WebP, or GIF — max 2 MB</p>
                    <div className="org-logo-upload__profile">
                      <div className="org-logo-upload__avatar-wrap">
                        {logoPreviewUrl ? (
                          <img
                            className="org-logo-upload__preview"
                            src={logoPreviewUrl}
                            alt="Organization logo preview"
                          />
                        ) : (
                          <div className="org-logo-upload__placeholder">
                            <svg
                              className="org-logo-upload__placeholder-icon"
                              width="40"
                              height="40"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              aria-hidden
                            >
                              <path
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <span className="org-logo-upload__placeholder-text">Add logo</span>
                          </div>
                        )}
                      </div>
                      <div className="org-logo-upload__actions">
                        <label className="org-logo-upload__choose">
                          <input
                            key={logoFieldKey}
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                            className="org-logo-upload__input"
                            disabled={orgCreateLoading}
                            onChange={(e) => {
                              const file = e.target.files?.[0] ?? null;
                              handleLogoFileChange(file);
                            }}
                          />
                          <span className="org-logo-upload__choose-text">
                            {logoPreviewUrl ? 'Change image' : 'Choose image'}
                          </span>
                        </label>
                        {logoPreviewUrl ? (
                          <button
                            type="button"
                            className="org-logo-upload__remove"
                            onClick={clearLogoSelection}
                            disabled={orgCreateLoading}
                            aria-label="Remove logo"
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Organization name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Team Hydra"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      disabled={orgCreateLoading}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Owner email</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="owner@example.com"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      disabled={orgCreateLoading}
                      required
                      autoComplete="email"
                    />
                  </div>
                  {orgCreateError && (
                    <div className="host-creation-error">
                      {orgCreateError}
                    </div>
                  )}
                  {orgCreateSuccess && (
                    <div className="host-creation-success">
                      {orgCreateSuccess}
                    </div>
                  )}
                  <button
                    type="submit"
                    className="host-creation-button"
                    disabled={
                      orgCreateLoading ||
                      !orgName.trim() ||
                      !ownerEmail.trim()
                    }
                  >
                    {orgCreateLoading
                      ? uploadPhase
                        ? 'Uploading logo...'
                        : 'Creating...'
                      : 'Create Org Account'}
                  </button>
                </form>
              </div>
            )}

            {orgTab === 'all' && (
              <div className="host-creation-card">
                <h2 className="card-title">All Organizations</h2>
                <AllOrgsList
                  organizations={organizations}
                  orgsLoading={orgsLoading}
                  orgsError={orgsError}
                  onOrgClick={handleOrgClick}
                  privilegedAccountActions={privilegedAccountActions}
                  selectedUserIds={orgSelectedIds}
                  onToggleSelect={toggleOrgSelect}
                  onSelectAll={handleSelectAllOrgs}
                  onRequestDelete={(userId) =>
                    setDeletePending({ context: 'org', ids: [userId] })
                  }
                  onRequestBlock={(userId) => setBlockPending({ ids: [userId], unblock: false })}
                  onRequestUnblock={(userId) => setBlockPending({ ids: [userId], unblock: true })}
                  onBulkDeleteSelected={() => {
                    if (orgSelectedIds.size === 0) return;
                    setDeletePending({ context: 'org', ids: [...orgSelectedIds] });
                  }}
                  actionPending={actionPending}
                />
              </div>
            )}
          </>
        )}
      </div>
      {/* </main> */}

      {/* Host Details Modal */}
      {selectedOrg && (
        <Modal
          isOpen={showOrgModal}
          onClose={handleCloseOrgModal}
          className="modal-large"
          title={selectedOrg.name?.trim() ? selectedOrg.name : 'Organization details'}
          showCloseButton={true}
        >
          <div className="host-modal-content">
            <div className="host-detail-section">
              {selectedOrg.logoUrl ? (
                <img
                  className="org-detail-logo org-detail-logo--top"
                  src={selectedOrg.logoUrl}
                  alt=""
                />
              ) : null}
              <div className="host-detail-item">
                <span className="detail-label">Organization ID:</span>
                <span className="detail-value">{selectedOrg.id}</span>
              </div>
              <div className="host-detail-item">
                <span className="detail-label">Role:</span>
                <span className="detail-value">{ORG_ACCOUNT_OWNER_ROLE_LABEL}</span>
              </div>
              <div className="host-detail-item">
                <span className="detail-label">Email:</span>
                <span className="detail-value">
                  {getOrganizationOwnerEmail(selectedOrg) ?? 'N/A'}
                </span>
              </div>
              {selectedOrg.createdAt && (
                <div className="host-detail-item">
                  <span className="detail-label">Created:</span>
                  <span className="detail-value">
                    {new Date(selectedOrg.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    })}
                  </span>
                </div>
              )}
            </div>

            <div className="org-tournaments-section">
              <div className="org-tournaments-header">
                <h4 className="org-tournaments-title">Tournaments</h4>
                <select
                  className="org-tournaments-filter"
                  value={tournamentStatus}
                  onChange={(e) =>
                    setTournamentStatus(e.target.value as OrgTournamentStatusFilter | '')
                  }
                  aria-label="Filter tournaments by status"
                >
                  {ORG_TOURNAMENT_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.label + String(opt.value)} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              {tournamentsLoading ? (
                <div className="org-tournaments-loading">
                  <p>Loading tournaments...</p>
                </div>
              ) : tournamentsError ? (
                <NoDataFound variant="panel" message={tournamentsError} />
              ) : tournaments.length === 0 ? (
                <NoDataFound
                  variant="panel"
                  message={ORG_DETAILS_NO_TOURNAMENTS_MESSAGE}
                />
              ) : (
                <div className="org-tournaments-list">
                  {tournaments.map((t, idx) => {
                    const tid = t._id || t.tournamentId || t.id || `row-${idx}`;
                    return (
                      <div key={tid} className="org-tournament-row">
                        <div className="org-tournament-main">
                          <span className="org-tournament-game">
                            {t.lobbyName || t.game || 'Tournament'}
                          </span>
                          <span className="org-tournament-meta">
                            {[t.date, t.startTime].filter(Boolean).join(' · ') || '—'}
                          </span>
                        </div>
                        {t.status ? (
                          <span className="org-tournament-status">{t.status}</span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      <ConfirmationModal
        isOpen={deletePending !== null}
        title={deletePending && deletePending.ids.length > 1 ? 'Delete users?' : 'Delete user?'}
        message={
          deletePending && deletePending.ids.length > 1
            ? `Delete ${deletePending.ids.length} users? This cannot be undone.`
            : 'Delete this user? This cannot be undone.'
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeletePending(null)}
      />

      <ConfirmationModal
        isOpen={blockPending !== null}
        title={blockPending?.unblock ? 'Unblock user?' : 'Block user?'}
        message={
          blockPending?.unblock
            ? 'Allow this user to sign in again?'
            : 'Block this user from signing in?'
        }
        confirmText={blockPending?.unblock ? 'Unblock' : 'Block'}
        cancelText="Cancel"
        onConfirm={confirmBlock}
        onCancel={() => setBlockPending(null)}
      />

      {selectedHost && (
        <Modal
          isOpen={showHostModal}
          onClose={handleCloseModal}
          className="modal-large"
          title={selectedHost.name?.trim() ? selectedHost.name : 'Host Details'}
          showCloseButton={true}
        >
          <div className="host-modal-content">
              <div className="host-detail-section">
                <div className="host-detail-item">
                  <span className="detail-label">Host ID:</span>
                  <span className="detail-value">{selectedHost.hostId || selectedHost._id || 'N/A'}</span>
                </div>
                <div className="host-detail-item">
                  <span className="detail-label">Role:</span>
                  <span className="detail-value">{HOST_ACCOUNT_ROLE_LABEL}</span>
                </div>
                <div className="host-detail-item">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{selectedHost.email}</span>
                </div>
                {selectedHost.createdAt && (
                  <div className="host-detail-item">
                    <span className="detail-label">Created:</span>
                    <span className="detail-value">
                      {new Date(selectedHost.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      })}
                    </span>
                  </div>
                )}
              </div>

              {statsLoading ? (
                <div className="host-stats-loading">
                  <p>Loading statistics...</p>
                </div>
              ) : hostStatistics ? (
                <div className="host-statistics-section">
                  <h4 className="statistics-title">Statistics</h4>
                  <div className="host-detail-item highlight">
                    <span className="detail-label">Total Lobbies Handled:</span>
                    <span className="detail-value highlight-value">{hostStatistics.totalLobbies}</span>
                  </div>
                  
                  {Object.keys(hostStatistics.timeSlotSummary || {}).length > 0 && (
                    <div className="host-timeslots-section">
                      <h5 className="timeslots-title">Time Slot Summary</h5>
                      <div className="timeslots-grid">
                        {Object.entries(hostStatistics.timeSlotSummary).map(([timeSlot, count]) => (
                          <div key={timeSlot} className="timeslot-item">
                            <span className="timeslot-time">{timeSlot}</span>
                            <span className="timeslot-count">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {hostStatistics.dailyRecords && hostStatistics.dailyRecords.length > 0 && (
                    <div className="host-daily-section">
                      <h5 className="daily-title">Daily Records</h5>
                      <div className="daily-records-list">
                        {hostStatistics.dailyRecords.map((record, idx) => (
                          <div key={idx} className="daily-record-item">
                            <span className="daily-date">{record.date}</span>
                            <span className="daily-lobbies">{record.lobbies} lobbies</span>
                            {record.tournaments && record.tournaments.length > 0 && (
                              <div className="daily-tournaments">
                                {record.tournaments.map((tournament, tIdx) => (
                                  <div key={tIdx} className="tournament-item">
                                    <span>{tournament.game || 'N/A'}</span>
                                    <span>{tournament.startTime}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <NoDataFound
                  variant="panel"
                  message={HOST_DETAILS_NO_STATISTICS_MESSAGE}
                />
              )}
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
};

export default HostCreationPage;

