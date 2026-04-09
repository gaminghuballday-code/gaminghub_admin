import { useState } from 'react';
import { useHostCreationPageLogic } from './HostCreationPage.logic';
import { useOrgAccountSectionLogic } from './OrgAccountSection.logic';
import AdminLayout from '@components/common/AdminLayout';
import { Modal } from '@components/common/Modal';
import NoDataFound from '@components/common/NoDataFound';
import AllHostsList from './AllHostsList';
import AllOrgsList from './AllOrgsList';
import type { OrgTournamentStatusFilter } from '@services/api';
import './HostCreationPage.scss';

type AccountTab = 'host' | 'org' | 'user';

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
  const [activeAccountTab, setActiveAccountTab] = useState<AccountTab>('host');
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
  } = useHostCreationPageLogic();

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
  } = useOrgAccountSectionLogic(activeAccountTab === 'org');

  return (
    <AdminLayout title="Account Creation">
      <div className="host-creation-content-wrapper">
        {/* Account Tabs */}
        <div className="account-type-tabs">
          <button
            className={`account-type-tab ${activeAccountTab === 'host' ? 'active' : ''}`}
            onClick={() => setActiveAccountTab('host')}
            type="button"
          >
            Host
          </button>
          <button
            className={`account-type-tab ${activeAccountTab === 'org' ? 'active' : ''}`}
            onClick={() => setActiveAccountTab('org')}
            type="button"
          >
            Org
          </button>
          <button
            className={`account-type-tab ${activeAccountTab === 'user' ? 'active' : ''}`}
            onClick={() => setActiveAccountTab('user')}
            type="button"
          >
            User
          </button>
        </div>

        {activeAccountTab === 'host' && (
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
                />
              </div>
            )}
          </>
        )}

        {activeAccountTab === 'org' && (
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
                />
              </div>
            )}
          </>
        )}

        {activeAccountTab === 'user' && (
            <div className="host-creation-card">
              <h2 className="card-title">User Account</h2>
              <NoDataFound message="User account section pending. Share fields/workflow and I will add it." />
            </div>
        )}
      </div>
      {/* </main> */}

      {/* Host Details Modal */}
      {selectedOrg && (
        <Modal
          isOpen={showOrgModal}
          onClose={handleCloseOrgModal}
          className="modal-large"
          title="Organization details"
          showCloseButton={true}
        >
          <div className="host-modal-content">
            <div className="host-detail-section">
              <div className="host-detail-item">
                <span className="detail-label">Name:</span>
                <span className="detail-value">{selectedOrg.name || 'N/A'}</span>
              </div>
              <div className="host-detail-item">
                <span className="detail-label">Organization ID:</span>
                <span className="detail-value">{selectedOrg.id}</span>
              </div>
              {selectedOrg.ownerUserId && (
                <div className="host-detail-item">
                  <span className="detail-label">Owner user:</span>
                  <span className="detail-value">{selectedOrg.ownerUserId}</span>
                </div>
              )}
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
              {selectedOrg.logoUrl ? (
                <img
                  className="org-detail-logo"
                  src={selectedOrg.logoUrl}
                  alt=""
                />
              ) : null}
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
                <div className="org-tournaments-error">
                  <p>{tournamentsError}</p>
                </div>
              ) : tournaments.length === 0 ? (
                <NoDataFound className="org-tournaments-empty" message="No tournaments for this organization." />
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

      {selectedHost && (
        <Modal
          isOpen={showHostModal}
          onClose={handleCloseModal}
          className="modal-large"
          title="Host Details"
          showCloseButton={true}
        >
          <div className="host-modal-content">
              <div className="host-detail-section">
                <div className="host-detail-item">
                  <span className="detail-label">Name:</span>
                  <span className="detail-value">{selectedHost.name || 'N/A'}</span>
                </div>
                <div className="host-detail-item">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{selectedHost.email}</span>
                </div>
                <div className="host-detail-item">
                  <span className="detail-label">Host ID:</span>
                  <span className="detail-value">{selectedHost.hostId || selectedHost._id || 'N/A'}</span>
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
                <NoDataFound className="host-stats-empty" message="No statistics available for this host." />
              )}
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
};

export default HostCreationPage;

