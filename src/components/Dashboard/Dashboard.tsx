import { useLocation, Link } from 'react-router-dom';
import { useDashboardLogic } from './Dashboard.logic';
import AppHeaderActions from '@components/common/AppHeaderActions';
import HostStatistics from './HostStatistics';
import { ROUTES } from '@utils/constants';
import './Dashboard.scss';

const Dashboard: React.FC = () => {
  const location = useLocation();
  const {
    user,
    sidebarOpen,
    toggleSidebar,
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
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-logo">BX</h2>
          <button
            className="sidebar-toggle"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>

        <nav className="sidebar-nav">
          <Link 
            to={ROUTES.DASHBOARD} 
            className={`nav-item ${location.pathname === ROUTES.DASHBOARD ? 'active' : ''}`}
            onClick={(e) => {
              // Prevent navigation if already on dashboard
              if (location.pathname === ROUTES.DASHBOARD) {
                e.preventDefault();
              }
            }}
          >
            <span className="nav-icon">📊</span>
            {sidebarOpen && <span className="nav-text">Dashboard</span>}
          </Link>
          <Link 
            to={ROUTES.GENERATE_LOBBY} 
            className={`nav-item ${location.pathname === ROUTES.GENERATE_LOBBY ? 'active' : ''}`}
            onClick={(e) => {
              // Prevent navigation if already on generate lobby page
              if (location.pathname === ROUTES.GENERATE_LOBBY) {
                e.preventDefault();
              }
            }}
          >
            <span className="nav-icon">🎮</span>
            {sidebarOpen && <span className="nav-text">Generate Lobby</span>}
          </Link>
          <Link 
            to={ROUTES.TOP_UP} 
            className={`nav-item ${location.pathname === ROUTES.TOP_UP ? 'active' : ''}`}
            onClick={(e) => {
              // Prevent navigation if already on top up page
              if (location.pathname === ROUTES.TOP_UP) {
                e.preventDefault();
              }
            }}
          >
            <span className="nav-icon">💰</span>
            {sidebarOpen && <span className="nav-text">Top Up</span>}
          </Link>
          <Link 
            to={ROUTES.HOST_CREATION} 
            className={`nav-item ${location.pathname === ROUTES.HOST_CREATION ? 'active' : ''}`}
            onClick={(e) => {
              // Prevent navigation if already on host creation page
              if (location.pathname === ROUTES.HOST_CREATION) {
                e.preventDefault();
              }
            }}
          >
            <span className="nav-icon">👤</span>
            {sidebarOpen && <span className="nav-text">Host Creation</span>}
          </Link>
          <Link 
            to={ROUTES.USER_HISTORY} 
            className={`nav-item ${location.pathname === ROUTES.USER_HISTORY ? 'active' : ''}`}
            onClick={(e) => {
              // Prevent navigation if already on user history page
              if (location.pathname === ROUTES.USER_HISTORY) {
                e.preventDefault();
              }
            }}
          >
            <span className="nav-icon">📜</span>
            {sidebarOpen && <span className="nav-text">User History</span>}
          </Link>
          <Link 
            to={ROUTES.ENQUIRIES} 
            className={`nav-item ${location.pathname === ROUTES.ENQUIRIES ? 'active' : ''}`}
            onClick={(e) => {
              // Prevent navigation if already on enquiries page
              if (location.pathname === ROUTES.ENQUIRIES) {
                e.preventDefault();
              }
            }}
          >
            <span className="nav-icon">📧</span>
            {sidebarOpen && <span className="nav-text">Enquiries</span>}
          </Link>
          <Link 
            to={ROUTES.SUPPORT_TICKETS} 
            className={`nav-item ${location.pathname === ROUTES.SUPPORT_TICKETS ? 'active' : ''}`}
            onClick={(e) => {
              // Prevent navigation if already on support tickets page
              if (location.pathname === ROUTES.SUPPORT_TICKETS) {
                e.preventDefault();
              }
            }}
          >
            <span className="nav-icon">🎫</span>
            {sidebarOpen && <span className="nav-text">Support Tickets</span>}
          </Link>
        </nav>

        <div className="sidebar-footer">
          {sidebarOpen && user && (
            <div className="user-info">
              <div className="user-email">{user.email}</div>
              {user.name && <div className="user-name">{user.name}</div>}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1>Dashboard</h1>
          <AppHeaderActions />
        </header>

        <div className="dashboard-content">
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
                <button
                  className="query-button"
                  onClick={handleQueryUsers}
                  disabled={usersLoading}
                >
                  🔍 Query
                </button>
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
                        <button
                          className="action-button block-button"
                          onClick={handleBlockUsers}
                          disabled={isBlocking || isUnblocking || usersLoading}
                        >
                          {isBlocking ? 'Blocking...' : 'Block'}
                        </button>
                        <button
                          className="action-button unblock-button"
                          onClick={handleUnblockUsers}
                          disabled={isBlocking || isUnblocking || usersLoading}
                        >
                          {isUnblocking ? 'Unblocking...' : 'Unblock'}
                        </button>
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
                              <button
                                type="button"
                                className="copy-email-btn"
                                onClick={(e) => handleCopyEmail(adminUser.email, e)}
                                title="Copy email"
                                aria-label="Copy email"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                              </button>
                            </span>
                          </div>
                          <div className="user-balance">
                            <span className="user-label">Balance GC:</span>
                            <span className="user-value balance-value">{adminUser.balanceGC ?? 0}</span>
                          </div>
                          <div className="user-status-row">
                            <div className="user-status">
                              <span className="user-label">Status:</span>
                              <span className={`user-value status-badge ${adminUser.isBlocked ? 'blocked' : 'active'}`}>
                                {adminUser.isBlocked ? 'Blocked' : 'Active'}
                              </span>
                            </div>
                            <div className="user-action-buttons" onClick={(e) => e.stopPropagation()}>
                              {adminUser.role?.toLowerCase() === 'admin' ? (
                                <span className="admin-badge" title="Admin users cannot be blocked">
                                  Admin
                                </span>
                              ) : adminUser.isBlocked ? (
                                <button
                                  className="user-action-button unblock-button"
                                  onClick={() => handleUnblockSingleUser(userId)}
                                  disabled={processingUserId === userId || isBlocking || isUnblocking || usersLoading}
                                  title="Unblock user"
                                >
                                  {processingUserId === userId ? 'Unblocking...' : 'Unblock'}
                                </button>
                              ) : (
                                <button
                                  className="user-action-button block-button"
                                  onClick={() => handleBlockSingleUser(userId)}
                                  disabled={processingUserId === userId || isBlocking || isUnblocking || usersLoading}
                                  title="Block user"
                                >
                                  {processingUserId === userId ? 'Blocking...' : 'Block'}
                                </button>
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
                    <button
                      className="pagination-button"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1 || usersLoading}
                      aria-label="Previous page"
                    >
                      ← Previous
                    </button>
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
                    <button
                      className="pagination-button"
                      onClick={handleNextPage}
                      disabled={currentPage >= pagination.totalPages || usersLoading}
                      aria-label="Next page"
                    >
                      Next →
                    </button>
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
      </main>

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
                  <button
                    type="button"
                    className="copy-email-btn"
                    onClick={(e) => handleCopyEmail(selectedUser.email, e)}
                    title="Copy email"
                    aria-label="Copy email"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </button>
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
    </div>
  );
};

export default Dashboard;

