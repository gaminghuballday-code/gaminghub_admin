import { useLocation, Link } from 'react-router-dom';
import { useEnquiriesPageLogic } from './EnquiriesPage.logic';
import AppHeaderActions from '@components/common/AppHeaderActions';
import { ROUTES } from '@utils/constants';
import './EnquiriesPage.scss';

const EnquiriesPage: React.FC = () => {
  const location = useLocation();
  const {
    user,
    sidebarOpen,
    toggleSidebar,
    enquiries,
    enquiriesLoading,
    enquiriesError,
    totalEnquiries,
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    // pageLimit,
    repliedFilter,
    subjectFilter,
    handleRepliedFilterChange,
    handleSubjectFilterChange,
    handlePreviousPage,
    handleNextPage,
    selectedEnquiry,
    showReplyModal,
    replyMessage,
    setReplyMessage,
    handleOpenReplyModal,
    handleCloseReplyModal,
    handleReplySubmit,
    isReplying,
    replyError,
  } = useEnquiriesPageLogic();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`enquiries-page-container ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Sidebar */}
      <aside className={`enquiries-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
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
              if (location.pathname === ROUTES.ENQUIRIES) {
                e.preventDefault();
              }
            }}
          >
            <span className="nav-icon">📧</span>
            {sidebarOpen && <span className="nav-text">Enquiries</span>}
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
      <main className="enquiries-main">
        <header className="enquiries-header">
          <div className="header-left">
            <h1>Enquiries</h1>
          </div>
          <AppHeaderActions />
        </header>

        <div className="enquiries-content">
          {/* Filters Section */}
          <div className="filters-section">
            <div className="filters-row">
              <div className="filter-group">
                <label className="filter-label">Status</label>
                <select
                  className="filter-select"
                  value={repliedFilter}
                  onChange={(e) => handleRepliedFilterChange(e.target.value as 'all' | 'replied' | 'unreplied')}
                >
                  <option value="all">All Enquiries</option>
                  <option value="replied">Replied</option>
                  <option value="unreplied">Unreplied</option>
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label">Subject</label>
                <input
                  type="text"
                  className="filter-input"
                  placeholder="Filter by subject..."
                  value={subjectFilter}
                  onChange={(e) => handleSubjectFilterChange(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Enquiries List */}
          <div className="enquiries-list">
            <div className="enquiries-list-header">
              <h2 className="enquiries-count">
                {totalEnquiries} {totalEnquiries === 1 ? 'Enquiry' : 'Enquiries'}
              </h2>
            </div>

            {enquiriesLoading ? (
              <div className="loading-message">Loading enquiries...</div>
            ) : enquiriesError ? (
              <div className="error-message">Error: {enquiriesError}</div>
            ) : enquiries.length === 0 ? (
              <div className="empty-message">No enquiries found.</div>
            ) : (
              <>
                {enquiries.map((enquiry) => (
                  <div key={enquiry._id || enquiry.id} className="enquiry-item">
                    <div className="enquiry-header">
                      <div className="enquiry-info">
                        <div className="enquiry-name-email">
                          <div className="enquiry-name">{enquiry.name}</div>
                          <div className="enquiry-email">{enquiry.email}</div>
                        </div>
                        <div className="enquiry-subject">{enquiry.subject}</div>
                        <div className="enquiry-meta">
                          <div className="enquiry-date">
                            {formatDate(enquiry.createdAt)}
                          </div>
                          <div className={`enquiry-status ${enquiry.replied ? 'replied' : 'unreplied'}`}>
                            {enquiry.replied ? 'Replied' : 'Unreplied'}
                          </div>
                        </div>
                      </div>
                      {!enquiry.replied && (
                        <button
                          className="reply-button"
                          onClick={() => handleOpenReplyModal(enquiry)}
                        >
                          Reply
                        </button>
                      )}
                    </div>
                    <div className="enquiry-message">{enquiry.message}</div>
                    {enquiry.replied && enquiry.replyMessage && (
                      <div className="enquiry-reply-info">
                        <strong>Reply:</strong> {enquiry.replyMessage}
                        {enquiry.repliedAt && (
                          <div style={{ marginTop: '8px', fontSize: '0.8rem', opacity: 0.8 }}>
                            Replied on: {formatDate(enquiry.repliedAt)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Pagination */}
                {totalPages > 0 && (
                  <div className="pagination">
                    <div className="pagination-info">
                      Page {currentPage} of {totalPages} ({totalEnquiries} total)
                    </div>
                    <div className="pagination-controls">
                      <button
                        className="pagination-button"
                        onClick={handlePreviousPage}
                        disabled={!hasPrevPage}
                      >
                        Previous
                      </button>
                      <button
                        className="pagination-button"
                        onClick={handleNextPage}
                        disabled={!hasNextPage}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Reply Modal */}
      {showReplyModal && selectedEnquiry && (
        <div className="reply-modal-overlay" onClick={handleCloseReplyModal}>
          <div className="reply-modal" onClick={(e) => e.stopPropagation()}>
            <div className="reply-modal-header">
              <h3 className="reply-modal-title">Reply to Enquiry</h3>
              <button
                className="reply-modal-close"
                onClick={handleCloseReplyModal}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <div className="reply-modal-body">
              <div className="reply-enquiry-info">
                <div>
                  <div className="reply-enquiry-label">From</div>
                  <div className="reply-enquiry-value">{selectedEnquiry.name} ({selectedEnquiry.email})</div>
                </div>
                <div>
                  <div className="reply-enquiry-label">Subject</div>
                  <div className="reply-enquiry-value">{selectedEnquiry.subject}</div>
                </div>
                <div>
                  <div className="reply-enquiry-label">Message</div>
                  <div className="reply-enquiry-value" style={{ whiteSpace: 'pre-wrap', marginTop: '4px' }}>
                    {selectedEnquiry.message}
                  </div>
                </div>
              </div>
              <div>
                <label className="filter-label" style={{ marginBottom: '8px', display: 'block' }}>
                  Your Reply
                </label>
                <div style={{ 
                  marginBottom: '8px', 
                  padding: '8px', 
                  background: 'rgba(var(--primary-color-rgb), 0.1)', 
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)'
                }}>
                  📧 Reply will be sent to: <strong style={{ color: 'var(--primary-color)' }}>{selectedEnquiry.email}</strong>
                </div>
                <textarea
                  className="reply-textarea"
                  placeholder="Type your reply message here. This will be sent to the user's email address..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  disabled={isReplying}
                />
              </div>
              {replyError && (
                <div className="error-message" style={{ margin: 0 }}>
                  Error: {replyError}
                </div>
              )}
            </div>
            <div className="reply-modal-footer">
              <button
                className="reply-cancel-button"
                onClick={handleCloseReplyModal}
                disabled={isReplying}
              >
                Cancel
              </button>
              <button
                className="reply-submit-button"
                onClick={handleReplySubmit}
                disabled={isReplying || !replyMessage.trim()}
              >
                {isReplying ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnquiriesPage;
