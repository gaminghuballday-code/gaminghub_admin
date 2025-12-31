import React, { useState } from 'react';
import { useSupportPageLogic } from './Support.logic';
import UserSidebar from '@components/user/common/UserSidebar';
import AppHeaderActions from '@components/common/AppHeaderActions';
import Loading from '@components/common/Loading';
import Modal from '@components/common/Modal/Modal';
import { Button } from '@components/common/Button';
import { Badge } from '@components/common/Badge';
import { useSidebarSync } from '@hooks/useSidebarSync';
import './Support.scss';

const Support: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'tickets' | 'faqs'>('tickets');

  const {
    user,
    isHost,
    tickets,
    ticketsLoading,
    ticketsError,
    totalTickets,
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    statusFilter,
    handleStatusFilterChange,
    handlePreviousPage,
    handleNextPage,
    // Create ticket (users only)
    showCreateModal,
    createData,
    setCreateData,
    handleOpenCreateModal,
    handleCloseCreateModal,
    handleCreateSubmit,
    isCreating,
    createError,
    // Update ticket (hosts only)
    selectedTicket,
    showUpdateModal,
    updateData,
    setUpdateData,
    handleOpenUpdateModal,
    handleCloseUpdateModal,
    handleUpdateSubmit,
    isUpdating,
    updateError,
    // View ticket detail (users only) - now chat modal
    showTicketDetailModal,
    ticketDetail,
    ticketDetailLoading,
    handleOpenTicketDetail,
    handleCloseTicketDetail,
    chatMessages,
    newMessage,
    setNewMessage,
    handleSendMessage,
    isSendingMessage,
    // FAQs (users only)
    faqs,
    faqsLoading,
  } = useSupportPageLogic(activeTab);

  useSidebarSync(sidebarOpen);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const formatDate = React.useCallback((dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  // Removed getStatusColor - using Badge component instead

  return (
    <div className={`support-container ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <UserSidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <main className="support-main">
        <header className="support-header">
          <div className="header-left">
            <h1>{isHost ? 'Support Tickets' : 'Help & Support'}</h1>
          </div>
          <AppHeaderActions />
        </header>

        <div className="support-content">
          {!isHost && (
            <div className="support-tabs">
              <button
                className={`tab-button ${activeTab === 'tickets' ? 'active' : ''}`}
                onClick={() => setActiveTab('tickets')}
              >
                My Tickets
              </button>
              <button
                className={`tab-button ${activeTab === 'faqs' ? 'active' : ''}`}
                onClick={() => setActiveTab('faqs')}
              >
                FAQs
              </button>
            </div>
          )}

          {(!isHost && activeTab === 'faqs') ? (
            // FAQs Section (Users only)
            <div className="faqs-section">
              <h2 className="section-title">Frequently Asked Questions</h2>
              {faqsLoading ? (
                <Loading />
              ) : faqs.length === 0 ? (
                <div className="empty-message">No FAQs available.</div>
              ) : (
                <div className="faqs-list">
                  {faqs.map((faq) => (
                    <div key={faq._id || faq.id} className="faq-item">
                      <div className="faq-question">
                        <strong>Q:</strong> {faq.question}
                      </div>
                      <div className="faq-answer">
                        <strong>A:</strong> {faq.answer}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Tickets Section
            <>
              {!isHost && (
                <div className="support-actions">
                  <Button variant="primary" onClick={handleOpenCreateModal}>
                    + Create New Ticket
                  </Button>
                </div>
              )}

              {/* Filters Section */}
              <div className="filters-section">
                <div className="filter-group">
                  <label className="filter-label">Status</label>
                  <select
                    className="filter-select"
                    value={statusFilter}
                    onChange={(e) =>
                      handleStatusFilterChange(
                        e.target.value as 'all' | 'open' | 'closed'
                      )
                    }
                  >
                    <option value="all">All Tickets</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
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
                  <Loading />
                ) : ticketsError ? (
                  <div className="error-message">Error: {ticketsError}</div>
                ) : tickets.length === 0 ? (
                  <div className="empty-message">No tickets found.</div>
                ) : (
                  <>
                    {tickets.map((ticket) => (
                      <div 
                        key={ticket._id || ticket.id || ticket.ticketId} 
                        className={`ticket-item ${!isHost ? 'ticket-item-clickable' : ''}`}
                        onClick={() => !isHost && handleOpenTicketDetail(ticket._id || ticket.id || ticket.ticketId || '')}
                      >
                        <div className="ticket-header">
                          <div className="ticket-info">
                            <div className="ticket-subject-row">
                              <div className="ticket-subject">
                                {ticket.subject}
                              </div>
                              <div className="ticket-status-wrapper">
                                <span className="ticket-status-label">Status:</span>
                                <Badge
                                  type="status"
                                  variant={ticket.status.toLowerCase().replace('-', '')}
                                >
                                  {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1).replace('-', ' ')}
                                </Badge>
                              </div>
                            </div>
                            <div className="ticket-meta">
                              <div className="ticket-date">{formatDate(ticket.createdAt)}</div>
                              {ticket.category && (
                                <div className="ticket-category">Category: {ticket.category}</div>
                              )}
                              {ticket.priority && (
                                <div className={`ticket-priority priority-${ticket.priority}`}>
                                  Priority: {ticket.priority}
                                </div>
                              )}
                            </div>
                          </div>
                          {isHost && (
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
                          )}
                        </div>
                        {ticket.description && ticket.description.trim() && (
                          <div className="ticket-description">{ticket.description}</div>
                        )}
                        {ticket.notes && ticket.notes.trim() && (
                          <div className="ticket-notes">
                            <strong>Notes:</strong> {ticket.notes}
                          </div>
                        )}
                        {ticket.resolution && ticket.resolution.trim() && (
                          <div className="ticket-resolution">
                            <strong>Resolution:</strong> {ticket.resolution}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="pagination-controls">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handlePreviousPage?.()}
                          disabled={!hasPrevPage || ticketsLoading}
                          title="Previous Page"
                          icon={
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                          }
                        >
                          Previous
                        </Button>

                        <div className="pagination-info">
                          <span>
                            Page {currentPage} of {totalPages}
                          </span>
                          <span className="pagination-count">
                            ({totalTickets} total items)
                          </span>
                        </div>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleNextPage?.()}
                          disabled={!hasNextPage || ticketsLoading}
                          title="Next Page"
                          icon={
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                          }
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Create Ticket Modal (Users only) */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={handleCloseCreateModal}
          title="Create Support Ticket/Dispute"
        >
          <div className="create-ticket-modal">
            <div className="form-group">
              <label className="form-label">Subject *</label>
              <select
                className="form-select"
                value={createData.subject}
                onChange={(e) => setCreateData({ ...createData, subject: e.target.value })}
                disabled={isCreating}
                required
              >
                <option value="">Select a subject</option>
                <option value="Dispute">Dispute</option>
                <option value="Refund">Refund</option>
                <option value="Top-up Limit">Top-up Limit</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Issue/Description *</label>
              <textarea
                className="form-textarea"
                placeholder="Describe your issue or dispute..."
                value={createData.issue}
                onChange={(e) => setCreateData({ ...createData, issue: e.target.value })}
                disabled={isCreating}
                rows={6}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Images (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter image URLs (comma separated)"
                value={createData.images?.join(', ') || ''}
                onChange={(e) => {
                  const urls = e.target.value.split(',').map(url => url.trim()).filter(url => url.length > 0);
                  setCreateData({ ...createData, images: urls.length > 0 ? urls : [] });
                }}
                disabled={isCreating}
              />
              <small className="form-hint form-hint-block">
                Enter image URLs separated by commas (e.g., https://example.com/image1.jpg, https://example.com/image2.jpg)
              </small>
            </div>
            {createError && <div className="error-message">{createError}</div>}
            <div className="modal-actions">
              <Button variant="secondary" onClick={handleCloseCreateModal} disabled={isCreating}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateSubmit}
                disabled={isCreating || !createData.subject.trim() || !createData.issue.trim()}
                loading={isCreating}
              >
                Create Ticket
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Update Ticket Modal (Hosts only) */}
      {showUpdateModal && selectedTicket && (
        <Modal
          isOpen={showUpdateModal}
          onClose={handleCloseUpdateModal}
          title="Update Ticket"
        >
          <div className="update-ticket-modal">
            <div className="ticket-info-display">
              <div>
                <div className="info-label">Subject</div>
                <div className="info-value">{selectedTicket.subject}</div>
              </div>
              <div>
                <div className="info-label">Description</div>
                <div className="info-value">{selectedTicket.description}</div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={updateData.status || ''}
                onChange={(e) =>
                  setUpdateData({
                    ...updateData,
                    status: e.target.value as 'open' | 'closed',
                  })
                }
                disabled={isUpdating}
              >
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                className="form-textarea"
                placeholder="Add internal notes..."
                value={updateData.notes}
                onChange={(e) => setUpdateData({ ...updateData, notes: e.target.value })}
                disabled={isUpdating}
                rows={4}
              />
            </div>
            {updateError && <div className="error-message">{updateError}</div>}
            <div className="modal-actions">
              <Button variant="secondary" onClick={handleCloseUpdateModal} disabled={isUpdating}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdateSubmit}
                disabled={isUpdating}
                loading={isUpdating}
              >
                Update Ticket
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Chat Modal (Users only) */}
      {showTicketDetailModal && ticketDetail && (
        <Modal
          isOpen={showTicketDetailModal}
          onClose={handleCloseTicketDetail}
          title={ticketDetail ? `Chat: ${ticketDetail.subject}` : 'Chat'}
          showCloseButton={true}
          className="chat-modal"
        >
          <div className="chat-container">
            {ticketDetailLoading ? (
              <Loading />
            ) : (
              <>
                <div className="chat-header-info">
                  <div className="chat-ticket-info">
                    <div className="chat-info-row">
                      <span className="chat-info-label">Status:</span>
                      <Badge
                        type="status"
                        variant={ticketDetail.status.toLowerCase().replace('-', '')}
                      >
                        {ticketDetail.status.charAt(0).toUpperCase() + ticketDetail.status.slice(1).replace('-', ' ')}
                      </Badge>
                    </div>
                    {ticketDetail.category && (
                      <div className="chat-info-row">
                        <span className="chat-info-label">Category:</span>
                        <span className="chat-info-value">{ticketDetail.category}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="chat-messages">
                  {chatMessages.map((message, index) => (
                    <div key={`${message.timestamp}-${index}-${message.content.slice(0, 20)}`} className={`chat-message ${message.sender === 'support' ? 'message-support' : 'message-user'}`}>
                      <div className="message-header">
                        <span className="message-sender">
                          {message.sender === 'support' ? 'Support' : (user?.name || user?.email || 'You')}
                        </span>
                        <span className="message-time">{formatDate(message.timestamp)}</span>
                      </div>
                      <div className="message-content">{message.content}</div>
                    </div>
                  ))}
                </div>
                {ticketDetail.status !== 'closed' && (
                  <div className="chat-input-section">
                    <textarea
                      className="chat-input"
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={isSendingMessage}
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
                        className="send-message-button"
                        onClick={handleSendMessage}
                        disabled={isSendingMessage || !newMessage.trim()}
                      >
                        {isSendingMessage ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </div>
                )}
                {ticketDetail.status === 'closed' && (
                  <div className="chat-closed-notice">
                    This chat has been closed. No further messages can be sent.
                  </div>
                )}
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Support;

