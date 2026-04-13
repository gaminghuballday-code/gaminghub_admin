import { useEffect } from 'react';
import { useDashboardLogic } from './Dashboard.logic';
import AdminLayout from '@components/common/AdminLayout';
import HostStatistics from './HostStatistics';
import InfluencerStatistics from './InfluencerStatistics';
import StatCard from './StatCard';
import { Button } from '@components/common/Button';
import { Badge } from '@components/common/Badge';
import NoDataFound from '@components/common/NoDataFound';
import './Dashboard.scss';

const Dashboard: React.FC = () => {
  const {
    user,
    users,
    usersLoading,
    usersError,
    pagination,
    roleFilter,
    handleRoleFilterChange,
    userQuery,
    handleQueryChange,
    handleQueryUsers,
    selectedUserIds,
    handleUserSelect,
    handleSelectAll,
    isAllSelected,
    handleBlockUsers,
    handleUnblockUsers,
    handleBlockSingleUser,
    handleUnblockSingleUser,
    isBlocking,
    isUnblocking,
    processingUserId,
    selectedUser,
    handleUserCardClick,
    handleCopyEmail,
    currentPage,
    usersPageLimit,
    handlePageChange,
    handlePreviousPage,
    handleNextPage,
    // Host Statistics
    activeTab,
    setActiveTab,
    hostStatistics,
    hostStatsLoading,
    hostStatsError,
    hostStatsFilters,
    totalHosts,
    totalLobbies,
    totalHostFeeEarned,
    allHostsLifetimeHostFeeEarned,
    hostStatsCurrentPage,
    hostStatsTotalPages,
    handleHostStatsFilterChange,
    handleClearHostStatsFilters,
    handleSearchHostStats,
    handleHostStatsPageChange,
    influencerStatsData,
    influencerStatsLoading,
    influencerStatsError,
    influencerStatsEmail,
    appliedInfluencerStatsEmail,
    handleInfluencerStatsEmailChange,
    handleSearchInfluencerStats,
    handleClearInfluencerStatsSearch,
    // Platform Statistics
    platformStats,
    platformStatsLoading,
    platformStatsError,
  } = useDashboardLogic();

  useEffect(() => {
    if (selectedUser) {
      document.body.classList.add('dashboard-details-open');
    } else {
      document.body.classList.remove('dashboard-details-open');
    }

    return () => {
      document.body.classList.remove('dashboard-details-open');
    };
  }, [selectedUser]);

  const getVisiblePages = (current: number, total: number): Array<number | 'ellipsis'> => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, index) => index + 1);
    }

    // Always keep first 2 and last 2 pages visible,
    // plus a small sliding window around current page.
    const importantPages = new Set<number>([
      1,
      2,
      total - 1,
      total,
      current - 1,
      current,
      current + 1,
    ]);

    const sortedPages = Array.from(importantPages)
      .filter((page) => page >= 1 && page <= total)
      .sort((a, b) => a - b);

    const result: Array<number | 'ellipsis'> = [];
    for (let i = 0; i < sortedPages.length; i += 1) {
      const page = sortedPages[i];
      const previous = sortedPages[i - 1];

      if (i > 0 && previous !== undefined) {
        if (page - previous === 2) {
          result.push(previous + 1);
        } else if (page - previous > 2) {
          result.push('ellipsis');
        }
      }

      result.push(page);
    }

    return result;
  };

  return (
    <AdminLayout title="Dashboard">
      <div className={`dashboard-content-wrapper ${selectedUser ? 'with-user-details' : ''}`}>
          <div className="dashboard-card welcome-card">
            <div className="welcome-content">
              <h2 className="card-title">Welcome</h2>
              <p className="card-content">
                {user ? `Welcome back, ${user.name || user.email}!` : 'Welcome to BooyahX Admin Dashboard'}
              </p>
              <p className="card-content-secondary">
                Manage your application from this centralized dashboard.
              </p>
              {platformStatsError && (
                <div className="dashboard-error-banner">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  <span>Failed to load some statistics. Using local data instead.</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats Overview Section */}
          <div className="stats-grid">
            <StatCard
              title="Total Users"
              value={platformStats?.totalUsers?.toLocaleString() ?? '0'}
              loading={platformStatsLoading}
              color="primary"
              trend={{ value: platformStats?.userGrowth || 0, isPositive: true }}
              icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>}
            />
            <StatCard
              title="Total Deposits"
              value={`₹${platformStats?.totalIncome?.toLocaleString() ?? '0'}`}
              loading={platformStatsLoading}
              color="success"
              trend={{ value: platformStats?.incomeGrowth || 0, isPositive: true }}
              icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>}
            />
            <StatCard
              title="Total Rewards"
              value={`₹${platformStats?.totalRewards?.toLocaleString() ?? '0'}`}
              loading={platformStatsLoading}
              color="danger"
              icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>}
            />
            <StatCard
              title="Net Profit"
              value={`₹${platformStats?.totalProfit?.toLocaleString() ?? '0'}`}
              loading={platformStatsLoading}
              color="info"
              icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>}
            />
          </div>

          <section className="influencer-program-section" aria-label="Influencer program statistics">
            <h2 className="influencer-program-section__title">Influencer program</h2>
            <div className="stats-grid stats-grid--influencer">
              <StatCard
                title="Influencer accounts"
                value={(platformStats?.influencerProgram?.influencerAccounts ?? 0).toLocaleString()}
                loading={platformStatsLoading}
                color="primary"
                icon={
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                }
              />
              <StatCard
                title="Paid referrals"
                value={(platformStats?.influencerProgram?.paidReferralsCount ?? 0).toLocaleString()}
                loading={platformStatsLoading}
                color="success"
                icon={
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <polyline points="17 11 19 13 23 9" />
                  </svg>
                }
              />
              <StatCard
                title="Total GC paid to influencers"
                value={`${(platformStats?.influencerProgram?.totalGcPaidToInfluencers ?? 0).toLocaleString()} GC`}
                loading={platformStatsLoading}
                color="warning"
                icon={
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v12" />
                    <path d="M8 10h8" />
                    <path d="M8 14h5" />
                  </svg>
                }
              />
            </div>
          </section>

          {/* Analytics Chart Section (temporarily removed) */}

          {/* Tabs */}
          <div className="dashboard-tabs">
            <button
              className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              General Details
            </button>
            <button
              className={`tab-button ${activeTab === 'hostStats' ? 'active' : ''}`}
              onClick={() => setActiveTab('hostStats')}
            >
              Host Statistics
            </button>
            <button
              className={`tab-button ${activeTab === 'influencerStats' ? 'active' : ''}`}
              onClick={() => setActiveTab('influencerStats')}
            >
              Influencer statistics
            </button>
            <button
              className={`tab-button ${activeTab === 'orgStats' ? 'active' : ''}`}
              onClick={() => setActiveTab('orgStats')}
            >
              Org Stats
            </button>
            <button
              className={`tab-button ${activeTab === 'subAdminStats' ? 'active' : ''}`}
              onClick={() => setActiveTab('subAdminStats')}
            >
              Sub-Admin Stats
            </button>
          </div>

          {/* Users List Card */}
          {activeTab === 'users' && (
          <div className="dashboard-card">
            <div className="card-header-with-filters">
              <div className="role-filters">
                <button
                  className={`filter-button ${roleFilter === 'all' ? 'active' : ''}`}
                  onClick={() => handleRoleFilterChange('all')}
                  disabled={usersLoading}
                >
                  All
                </button>
                <button
                  className={`filter-button ${roleFilter === 'admin' ? 'active' : ''}`}
                  onClick={() => handleRoleFilterChange('admin')}
                  disabled={usersLoading}
                >
                  Admin
                </button>
                <button
                  className={`filter-button ${roleFilter === 'host' ? 'active' : ''}`}
                  onClick={() => handleRoleFilterChange('host')}
                  disabled={usersLoading}
                >
                  Host
                </button>
                <button
                  className={`filter-button ${roleFilter === 'user' ? 'active' : ''}`}
                  onClick={() => handleRoleFilterChange('user')}
                  disabled={usersLoading}
                >
                  User
                </button>
                <button
                  className={`filter-button ${roleFilter === 'influencer' ? 'active' : ''}`}
                  onClick={() => handleRoleFilterChange('influencer')}
                  disabled={usersLoading}
                >
                  Influencer
                </button>
              </div>
            </div>
            <div className="user-query-section">
              <div className="query-input-group">
                <input
                  type="text"
                  className="query-input"
                  placeholder="Search users by name or email..."
                  value={userQuery}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleQueryUsers();
                    }
                  }}
                  disabled={usersLoading}
                />
                <Button
                  variant="primary"
                  onClick={handleQueryUsers}
                  disabled={usersLoading}
                  loading={usersLoading}
                >
                  🔍 Query
                </Button>
              </div>
            </div>
            {usersLoading ? (
              <div className="users-loading">
                <p>Loading users...</p>
              </div>
            ) : usersError ? (
              <div className="users-error">
                <p>{usersError}</p>
              </div>
            ) : users.length > 0 ? (
              <div className="users-list">
                <div className="users-count-header">
                  <div className="users-count-left">
                    <span className="users-count-text">
                      {pagination ? (
                        <>Total: {pagination.total} users</>
                      ) : (
                        <>Total: {users.length} users</>
                      )}
                    </span>
                    {selectedUserIds.size > 0 && (
                      <span className="selected-count">
                        ({selectedUserIds.size} selected)
                      </span>
                    )}
                  </div>
                  <div className="users-actions">
                    <label className="select-all-checkbox">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        disabled={usersLoading}
                      />
                      <span>Select All</span>
                    </label>
                    {selectedUserIds.size > 0 && (
                      <div className="action-buttons">
                        <Button
                          variant="danger"
                          onClick={handleBlockUsers}
                          disabled={isUnblocking || usersLoading}
                          loading={isBlocking}
                        >
                          Block
                        </Button>
                        <Button
                          variant="success"
                          onClick={handleUnblockUsers}
                          disabled={isBlocking || usersLoading}
                          loading={isUnblocking}
                        >
                          Unblock
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="users-cards-container">
                  {users.map((adminUser, index) => {
                    const userId = adminUser.userId || adminUser._id || '';
                    const isSelected = Boolean(userId && selectedUserIds.has(userId));
                    return (
                      <div 
                        key={userId} 
                        className={`user-card ${isSelected ? 'selected' : ''} ${selectedUser?._id === adminUser._id ? 'active' : ''}`}
                        onClick={() => handleUserCardClick(adminUser)}
                      >
                        <div className="user-card-checkbox" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleUserSelect(userId)}
                            disabled={usersLoading || adminUser.role?.toLowerCase() === 'admin'}
                            title={adminUser.role?.toLowerCase() === 'admin' ? 'Admin users cannot be selected' : ''}
                          />
                        </div>
                        <div className="user-card-number">{index + 1}</div>
                        <div className="user-card-content">
                          <div className="user-name">
                            <span className="user-label">Name:</span>
                            <span className="user-value">{adminUser.name || 'N/A'}</span>
                          </div>
                          <div className="user-email">
                            <span className="user-label">Email:</span>
                            <span className="user-value">
                              <span className="user-email-full">{adminUser.email}</span>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={(e) => handleCopyEmail(adminUser.email, e)}
                                title="Copy email"
                                aria-label="Copy email"
                                icon={
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                  </svg>
                                }
                              />
                            </span>
                          </div>
                          <div className="user-balance">
                            <span className="user-label">Balance GC:</span>
                            <span className="user-value balance-value">{adminUser.balanceGC ?? 0}</span>
                          </div>
                          <div className="user-status-row">
                            <div className="user-status">
                              <span className="user-label">Status:</span>
                              <Badge
                                type="status"
                                variant={adminUser.isBlocked ? 'failed' : 'completed'}
                              >
                                {adminUser.isBlocked ? 'Blocked' : 'Active'}
                              </Badge>
                            </div>
                            <div className="user-action-buttons" onClick={(e) => e.stopPropagation()}>
                              {adminUser.role?.toLowerCase() === 'admin' ? (
                                <span className="admin-badge" title="Admin users cannot be blocked">
                                  Admin
                                </span>
                              ) : adminUser.isBlocked ? (
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => handleUnblockSingleUser(userId)}
                                  disabled={processingUserId !== userId && (isBlocking || isUnblocking || usersLoading)}
                                  loading={processingUserId === userId}
                                  title="Unblock user"
                                >
                                  Unblock
                                </Button>
                              ) : (
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleBlockSingleUser(userId)}
                                  disabled={processingUserId !== userId && (isBlocking || isUnblocking || usersLoading)}
                                  loading={processingUserId === userId}
                                  title="Block user"
                                >
                                  Block
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Pagination Controls */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="pagination-controls">
                    <div className="pagination-nav">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="pagination-nav-button"
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1 || usersLoading}
                        aria-label="Previous page"
                      >
                        ← Prev
                      </Button>
                    </div>
                    <div className="pagination-info">
                      <span className="pagination-text">
                        Page {currentPage} of {pagination.totalPages}
                      </span>
                      {pagination.total > 0 && (
                        <span className="pagination-total">
                          (Showing {((currentPage - 1) * usersPageLimit) + 1}-{Math.min(currentPage * usersPageLimit, pagination.total)} of {pagination.total})
                        </span>
                      )}
                      <div className="pagination-pages">
                        {getVisiblePages(currentPage, pagination.totalPages).map((item, index) => {
                          if (item === 'ellipsis') {
                            return (
                              <span
                                key={`ellipsis-${index}`}
                                className="pagination-ellipsis"
                                aria-hidden="true"
                              >
                                ...
                              </span>
                            );
                          }

                          return (
                            <button
                              key={item}
                              type="button"
                              className={`pagination-page-button ${item === currentPage ? 'active' : ''}`}
                              onClick={() => handlePageChange(item)}
                              disabled={usersLoading}
                              aria-label={`Go to page ${item}`}
                              aria-current={item === currentPage ? 'page' : undefined}
                            >
                              {item}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="pagination-nav">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="pagination-nav-button"
                        onClick={handleNextPage}
                        disabled={currentPage >= pagination.totalPages || usersLoading}
                        aria-label="Next page"
                      >
                        Next →
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="users-empty">
                <p>No users found.</p>
              </div>
            )}
          </div>
          )}

          {/* Host Statistics Card */}
          {activeTab === 'hostStats' && (
            <HostStatistics
              hostStatistics={hostStatistics}
              hostStatsLoading={hostStatsLoading}
              hostStatsError={hostStatsError}
              totalHosts={totalHosts}
              totalLobbies={totalLobbies}
              totalHostFeeEarned={totalHostFeeEarned}
              allHostsLifetimeHostFeeEarned={allHostsLifetimeHostFeeEarned}
              hostStatsFilters={hostStatsFilters}
              currentPage={hostStatsCurrentPage}
              totalPages={hostStatsTotalPages}
              onFilterChange={handleHostStatsFilterChange}
              onClearFilters={handleClearHostStatsFilters}
              onSearch={handleSearchHostStats}
              onPageChange={handleHostStatsPageChange}
            />
          )}

          {activeTab === 'influencerStats' && (
            <InfluencerStatistics
              stats={influencerStatsData}
              loading={influencerStatsLoading}
              error={influencerStatsError}
              emailInput={influencerStatsEmail}
              appliedEmail={appliedInfluencerStatsEmail}
              onEmailChange={handleInfluencerStatsEmailChange}
              onSearch={handleSearchInfluencerStats}
              onClearSearch={handleClearInfluencerStatsSearch}
            />
          )}

          {(activeTab === 'orgStats' || activeTab === 'subAdminStats') && (
            <div className="dashboard-card no-data-card">
              <h3 className="card-title">
                {activeTab === 'orgStats' ? 'Org Stats' : 'Sub-Admin Stats'}
              </h3>
              <NoDataFound className="no-data-text" />
            </div>
          )}
      </div>

      {/* User Details Sidebar */}
      {selectedUser && (
        <aside className="user-details-sidebar">
          <div className="user-details-header">
            <h3>User Details</h3>
            <button
              className="close-details-button"
              onClick={() => handleUserCardClick(null)}
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div className="user-details-content">
            <div className="user-detail-section">
              <div className="user-detail-item">
                <span className="detail-label">Name:</span>
                <span className="detail-value">{selectedUser.name || 'N/A'}</span>
              </div>
              <div className="user-detail-item user-detail-item--email">
                <span className="detail-label">Email:</span>
                <span className="detail-value">
                  <span className="user-email-full user-email-full--single-line">{selectedUser.email}</span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={(e) => handleCopyEmail(selectedUser.email, e)}
                    title="Copy email"
                    aria-label="Copy email"
                    icon={
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    }
                  />
                </span>
              </div>
              <div className="user-detail-item">
                <span className="detail-label">Role:</span>
                <span className="detail-value">{selectedUser.role || 'N/A'}</span>
              </div>
              <div className="user-detail-item">
                <span className="detail-label">Status:</span>
                <span className={`detail-value status-badge ${selectedUser.isBlocked ? 'blocked' : 'active'}`}>
                  {selectedUser.isBlocked ? 'Blocked' : 'Active'}
                </span>
              </div>
              <div className="user-detail-item highlight">
                <span className="detail-label">Balance GC:</span>
                <span className="detail-value balance-highlight">{selectedUser.balanceGC ?? 0}</span>
              </div>
              {selectedUser.createdAt && (
                <div className="user-detail-item">
                  <span className="detail-label">Created:</span>
                  <span className="detail-value">
                    {new Date(selectedUser.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </aside>
      )}
    </AdminLayout>
  );
};

export default Dashboard;

