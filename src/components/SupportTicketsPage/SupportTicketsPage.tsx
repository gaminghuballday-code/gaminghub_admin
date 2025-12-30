import React from 'react';
import { useSupportTicketsPageLogic } from './SupportTicketsPage.logic';
import AdminLayout from '@components/common/AdminLayout';
import Modal from '@components/common/Modal/Modal';
import { Button } from '@components/common/Button';
import { Badge } from '@components/common/Badge';
import './SupportTicketsPage.scss';

const SupportTicketsPage: React.FC = () => {
  const {
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

  // Removed getStatusColor - using Badge component instead

  return (
    <AdminLayout title="Support Tickets">
      <div className="support-tickets-content-wrapper">
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
                            <Badge
                              type="status"
                              variant={ticket.status.toLowerCase().replace('-', '')}
                            >
                              {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1).replace('-', ' ')}
                            </Badge>
                          </td>
                          <td className="ticket-date-cell">{formatDate(ticket.createdAt)}</td>
                          <td className="ticket-actions-cell">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenChat(ticket);
                              }}
                            >
                              Open Chat
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenUpdateModal(ticket);
                              }}
                            >
                              Update
                            </Button>
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
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handlePreviousPage}
                        disabled={!hasPrevPage}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={!hasNextPage}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

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
                  <Badge
                    type="status"
                    variant={selectedChatTicket.status.toLowerCase().replace('-', '')}
                  >
                    {selectedChatTicket.status.charAt(0).toUpperCase() + selectedChatTicket.status.slice(1).replace('-', ' ')}
                  </Badge>
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
                  <Button
                    variant="danger"
                    onClick={handleEndChat}
                    disabled={isSendingMessage || isEndingChat}
                    loading={isEndingChat}
                  >
                    End Chat
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSendMessage}
                    disabled={isEndingChat || !newMessage.trim()}
                    loading={isSendingMessage}
                  >
                    Send
                  </Button>
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
                  <div className="update-ticket-value text-pre-wrap mt-4px">
                    {selectedTicket.description}
                  </div>
                </div>
              </div>
              <div>
                <label className="filter-label mb-8px d-block">
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
                <label className="filter-label mb-8px d-block">
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
                <label className="filter-label mb-8px d-block">
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
                <div className="error-message margin-0">
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
    </AdminLayout>
  );
};

export default SupportTicketsPage;

