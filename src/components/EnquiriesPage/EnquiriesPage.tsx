import { useEnquiriesPageLogic } from './EnquiriesPage.logic';
import AdminLayout from '@components/common/AdminLayout';
import { Button } from '@components/common/Button';
import './EnquiriesPage.scss';

const EnquiriesPage: React.FC = () => {
  const {
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
    <AdminLayout title="Enquiries">
      <div className="enquiries-content-wrapper">
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
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenReplyModal(enquiry)}
                        >
                          Reply
                        </Button>
                      )}
                    </div>
                    <div className="enquiry-message">{enquiry.message}</div>
                    {enquiry.replied && enquiry.replyMessage && (
                      <div className="enquiry-reply-info">
                        <strong>Reply:</strong> {enquiry.replyMessage}
                        {enquiry.repliedAt && (
                          <div className="mt-8px font-size-0-8rem">
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
      {/* </main> */}

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
                  <div className="reply-enquiry-value text-pre-wrap mt-4px">
                    {selectedEnquiry.message}
                  </div>
                </div>
              </div>
              <div>
                <label className="filter-label mb-8px d-block">
                  Your Reply
                </label>
                <div className="reply-info-box">
                  📧 Reply will be sent to: <strong>{selectedEnquiry.email}</strong>
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
                <div className="error-message margin-0">
                  Error: {replyError}
                </div>
              )}
            </div>
            <div className="reply-modal-footer">
              <Button
                variant="secondary"
                onClick={handleCloseReplyModal}
                disabled={isReplying}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleReplySubmit}
                disabled={isReplying || !replyMessage.trim()}
                loading={isReplying}
              >
                Send Reply
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default EnquiriesPage;
