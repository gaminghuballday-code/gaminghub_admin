import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useSupportTicketsPageLogic } from './SupportTicketsPage.logic';
import AppHeaderActions from '@components/common/AppHeaderActions';
import { ROUTES } from '@utils/constants';
import Modal from '@components/common/Modal/Modal';
import './SupportTicketsPage.scss';

const SupportTicketsPage: React.FC = () => {
  const location = useLocation();
  const {
    user,
    sidebarOpen,
    toggleSidebar,
    tickets,
    ticketsLoading,
    ticketsError,
    totalTickets,
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    statusFilter,
    searchFilter,
    handleStatusFilterChange,
    handleSearchFilterChange,
    handlePreviousPage,
    handleNextPage,
    selectedTicket,
    showUpdateModal,
    updateData,
    setUpdateData,
    handleOpenUpdateModal,
    handleCloseUpdateModal,
    handleUpdateSubmit,
    isUpdating,
    updateError,
    showChatModal,
    selectedChatTicket,
    chatMessages,
    newMessage,
    setNewMessage,
    handleOpenChat,
    handleCloseChat,
    handleSendMessage,
    handleEndChat,
    isSendingMessage,
    isEndingChat,
  } = useSupportTicketsPageLogic();

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'status-open';
      case 'in-progress':
        return 'status-in-progress';
      case 'resolved':
        return 'status-resolved';
      case 'closed':
        return 'status-closed';
      default:
        return '';
    }
  };

  return (
    <div className={`support-tickets-page-container ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Sidebar */}
      <aside className={`support-tickets-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
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
          <Link
            to={ROUTES.SUPPORT_TICKETS}
            className={`nav-item ${location.pathname === ROUTES.SUPPORT_TICKETS ? 'active' : ''}`}
            onClick={(e) => {
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
      <main className="support-tickets-main">
        <header className="support-tickets-header">
          <div className="header-left">
            <h1>Support Tickets</h1>
          </div>
          <AppHeaderActions />
        </header>

        <div className="support-tickets-content">
          {/* Filters Section */}
          <div className="filters-section">
            <div className="filters-row">
              <div className="filter-group">
                <label className="filter-label">Status</label>
                <select
                  className="filter-select"
                  value={statusFilter}
                  onChange={(e) =>
                    handleStatusFilterChange(
                      e.target.value as 'all' | 'open' | 'in-progress' | 'resolved' | 'closed'
                    )
                  }
                >
                  <option value="all">All Tickets</option>
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label">Search</label>
                <input
                  type="text"
                  className="filter-input"
                  placeholder="Search by subject or description..."
                  value={searchFilter}
                  onChange={(e) => handleSearchFilterChange(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Tickets List */}
          <div className="tickets-list">
            <div className="tickets-list-header">
              <h2 className="tickets-count">
                {totalTickets} {totalTickets === 1 ? 'Ticket' : 'Tickets'}
              </h2>
            </div>

            {ticketsLoading ? (
              <div className="loading-message">Loading tickets...</div>
            ) : ticketsError ? (
              <div className="error-message">Error: {ticketsError}</div>
            ) : tickets.length === 0 ? (
              <div className="empty-message">No tickets found.</div>
            ) : (
              <>
                <div className="tickets-table-wrapper">
                  <table className="tickets-table">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>User</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((ticket) => (
                        <tr 
                          key={ticket._id || ticket.id || ticket.ticketId}
                          className="ticket-row"
                          onClick={() => handleOpenChat(ticket)}
                        >
                          <td className="ticket-subject-cell">
                            <div className="ticket-subject">{ticket.subject}</div>
                            {ticket.category && (
                              <div className="ticket-category-badge">{ticket.category}</div>
                            )}
                          </td>
                          <td className="ticket-user-cell">
                            {(() => {
                              // Check if userId is an object with email and name
                              if (ticket.userId && typeof ticket.userId === 'object' && 'email' in ticket.userId) {
                                return (
                                  <div className="user-info-cell">
                                    <div className="user-name">{ticket.userId.name || 'Unknown'}</div>
                                    <div className="user-email">{ticket.userId.email}</div>
                                  </div>
                                );
                              }
                              // Check if hostId is an object with email and name
                              if (ticket.hostId && typeof ticket.hostId === 'object' && 'email' in ticket.hostId) {
                                return (
                                  <div className="user-info-cell">
                                    <div className="user-name">{ticket.hostId.name || 'Unknown'}</div>
                                    <div className="user-email">{ticket.hostId.email}</div>
                                  </div>
                                );
                              }
                              // Fallback to string values
                              return (
                                <div className="user-info-cell">
                                  <div className="user-name">{ticket.userName || ticket.hostName || 'Unknown User'}</div>
                                  <div className="user-email">{ticket.userEmail || ticket.hostEmail || ''}</div>
                                </div>
                              );
                            })()}
                          </td>
                          <td>
                            <span className={`ticket-status-badge ${getStatusColor(ticket.status)}`}>
                              {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1).replace('-', ' ')}
                            </span>
                          </td>
                          <td className="ticket-date-cell">{formatDate(ticket.createdAt)}</td>
                          <td className="ticket-actions-cell">
                            <button
                              className="chat-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenChat(ticket);
                              }}
                            >
                              Open Chat
                            </button>
                            <button
                              className="update-button-small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenUpdateModal(ticket);
                              }}
                            >
                              Update
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 0 && (
                  <div className="pagination">
                    <div className="pagination-info">
                      Page {currentPage} of {totalPages} ({totalTickets} total)
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

      {/* Chat Modal */}
      <Modal
        isOpen={showChatModal}
        onClose={handleCloseChat}
        title={selectedChatTicket ? `Chat: ${selectedChatTicket.subject}` : 'Chat'}
        showCloseButton={true}
        className="chat-modal"
      >
        {selectedChatTicket && (
          <div className="chat-container">
            <div className="chat-header-info">
              <div className="chat-ticket-info">
                <div className="chat-info-row">
                  <span className="chat-info-label">User:</span>
                  <span className="chat-info-value">
                    {(() => {
                      if (selectedChatTicket.userId && typeof selectedChatTicket.userId === 'object' && 'email' in selectedChatTicket.userId) {
                        return `${selectedChatTicket.userId.name || 'Unknown'} (${selectedChatTicket.userId.email})`;
                      }
                      if (selectedChatTicket.hostId && typeof selectedChatTicket.hostId === 'object' && 'email' in selectedChatTicket.hostId) {
                        return `${selectedChatTicket.hostId.name || 'Unknown'} (${selectedChatTicket.hostId.email})`;
                      }
                      return selectedChatTicket.userEmail || selectedChatTicket.hostEmail || selectedChatTicket.userName || selectedChatTicket.hostName || 'Unknown';
                    })()}
                  </span>
                </div>
                <div className="chat-info-row">
                  <span className="chat-info-label">Status:</span>
                  <span className={`chat-status-badge ${getStatusColor(selectedChatTicket.status)}`}>
                    {selectedChatTicket.status.charAt(0).toUpperCase() + selectedChatTicket.status.slice(1).replace('-', ' ')}
                  </span>
                </div>
              </div>
            </div>
            <div className="chat-messages">
              {chatMessages.map((message, index) => (
                <div key={index} className={`chat-message ${message.sender === 'support' ? 'message-support' : 'message-user'}`}>
                  <div className="message-header">
                    <span className="message-sender">
                      {message.sender === 'support' 
                        ? 'Support' 
                        : (() => {
                            if (selectedChatTicket.userId && typeof selectedChatTicket.userId === 'object' && 'name' in selectedChatTicket.userId) {
                              return selectedChatTicket.userId.name || selectedChatTicket.userId.email || 'User';
                            }
                            return selectedChatTicket.userName || selectedChatTicket.userEmail || 'User';
                          })()
                      }
                    </span>
                    <span className="message-time">{formatDate(message.timestamp)}</span>
                  </div>
                  <div className="message-content">{message.content}</div>
                </div>
              ))}
            </div>
            {selectedChatTicket.status !== 'closed' && (
              <div className="chat-input-section">
                <textarea
                  className="chat-input"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={isSendingMessage || isEndingChat}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (newMessage.trim()) {
                        handleSendMessage();
                      }
                    }
                  }}
                />
                <div className="chat-actions">
                  <button
                    className="end-chat-button"
                    onClick={handleEndChat}
                    disabled={isSendingMessage || isEndingChat}
                  >
                    {isEndingChat ? 'Ending...' : 'End Chat'}
                  </button>
                  <button
                    className="send-message-button"
                    onClick={handleSendMessage}
                    disabled={isSendingMessage || isEndingChat || !newMessage.trim()}
                  >
                    {isSendingMessage ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            )}
            {selectedChatTicket.status === 'closed' && (
              <div className="chat-closed-notice">
                This chat has been closed. No further messages can be sent.
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Update Modal */}
      {showUpdateModal && selectedTicket && (
        <div className="update-modal-overlay" onClick={handleCloseUpdateModal}>
          <div className="update-modal" onClick={(e) => e.stopPropagation()}>
            <div className="update-modal-header">
              <h3 className="update-modal-title">Update Ticket</h3>
              <button
                className="update-modal-close"
                onClick={handleCloseUpdateModal}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <div className="update-modal-body">
              <div className="update-ticket-info">
                <div>
                  <div className="update-ticket-label">Subject</div>
                  <div className="update-ticket-value">{selectedTicket.subject}</div>
                </div>
                <div>
                  <div className="update-ticket-label">Description</div>
                  <div className="update-ticket-value" style={{ whiteSpace: 'pre-wrap', marginTop: '4px' }}>
                    {selectedTicket.description}
                  </div>
                </div>
              </div>
              <div>
                <label className="filter-label" style={{ marginBottom: '8px', display: 'block' }}>
                  Status
                </label>
                <select
                  className="filter-select"
                  value={updateData.status || ''}
                  onChange={(e) =>
                    setUpdateData({
                      ...updateData,
                      status: e.target.value as 'open' | 'in-progress' | 'resolved' | 'closed',
                    })
                  }
                  disabled={isUpdating}
                >
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="filter-label" style={{ marginBottom: '8px', display: 'block' }}>
                  Resolution
                </label>
                <textarea
                  className="update-textarea"
                  placeholder="Enter resolution details..."
                  value={updateData.resolution}
                  onChange={(e) => setUpdateData({ ...updateData, resolution: e.target.value })}
                  disabled={isUpdating}
                />
              </div>
              <div>
                <label className="filter-label" style={{ marginBottom: '8px', display: 'block' }}>
                  Notes
                </label>
                <textarea
                  className="update-textarea"
                  placeholder="Enter internal notes..."
                  value={updateData.notes}
                  onChange={(e) => setUpdateData({ ...updateData, notes: e.target.value })}
                  disabled={isUpdating}
                />
              </div>
              {updateError && (
                <div className="error-message" style={{ margin: 0 }}>
                  Error: {updateError}
                </div>
              )}
            </div>
            <div className="update-modal-footer">
              <button
                className="update-cancel-button"
                onClick={handleCloseUpdateModal}
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                className="update-submit-button"
                onClick={handleUpdateSubmit}
                disabled={isUpdating}
              >
                {isUpdating ? 'Updating...' : 'Update Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTicketsPage;

