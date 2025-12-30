import { useDashboardLogic } from './Dashboard.logic';
import AdminLayout from '@components/common/AdminLayout';
import HostStatistics from './HostStatistics';
import { Button } from '@components/common/Button';
import { Badge } from '@components/common/Badge';
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
    handleHostStatsFilterChange,
    handleClearHostStatsFilters,
    handleSearchHostStats,
    // loadHostStatistics,
  } = useDashboardLogic();

  return (
    <AdminLayout title="Dashboard">
      <div className="dashboard-content-wrapper">
          {/* Welcome Card */}
          <div className="dashboard-card">
            <h2 className="card-title">Welcome</h2>
            <p className="card-content">
              {user ? `Welcome back, ${user.name || user.email}!` : 'Welcome to BooyahX Admin Dashboard'}
            </p>
            <p className="card-content-secondary">
              Manage your application from this centralized dashboard.
            </p>
          </div>

          {/* Tabs */}
          <div className="dashboard-tabs">
            <button
              className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              Users
            </button>
            <button
              className={`tab-button ${activeTab === 'hostStats' ? 'active' : ''}`}
              onClick={() => setActiveTab('hostStats')}
            >
              Host Statistics
            </button>
          </div>

          {/* Users List Card */}
          {activeTab === 'users' && (
          <div className="dashboard-card">
            <div className="card-header-with-filters">
              <h2 className="card-title">Users</h2>
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
                              {adminUser.email}
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
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1 || usersLoading}
                      aria-label="Previous page"
                    >
                      ← Previous
                    </Button>
                    <div className="pagination-info">
                      <span className="pagination-text">
                        Page {currentPage} of {pagination.totalPages}
                      </span>
                      {pagination.total > 0 && (
                        <span className="pagination-total">
                          (Showing {((currentPage - 1) * 10) + 1}-{Math.min(currentPage * 10, pagination.total)} of {pagination.total})
                        </span>
                      )}
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage >= pagination.totalPages || usersLoading}
                      aria-label="Next page"
                    >
                      Next →
                    </Button>
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
              hostStatsFilters={hostStatsFilters}
              onFilterChange={handleHostStatsFilterChange}
              onClearFilters={handleClearHostStatsFilters}
              onSearch={handleSearchHostStats}
            />
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
              <div className="user-detail-item">
                <span className="detail-label">Email:</span>
                <span className="detail-value">
                  {selectedUser.email}
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

