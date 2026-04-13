import { useState } from 'react';
import { useEnquiriesPageLogic } from './EnquiriesPage.logic';
import AdminLayout from '@components/common/AdminLayout';
import { Button } from '@components/common/Button';
import Loading from '@components/common/Loading';
import InquiryReplyTemplatesPanel from './InquiryReplyTemplatesPanel';
import { getInquirySubjectLabel, INQUIRY_SUBJECT_OPTIONS } from '@utils/inquirySubjects';
import '../NotificationsPage/NotificationsPage.scss';
import './EnquiriesPage.scss';

const EnquiriesPage: React.FC = () => {
  const [activePanel, setActivePanel] = useState<'enquiries' | 'templates'>('enquiries');

  const {
    isAuthenticated,
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
    replyTemplates,
    replyTemplatesLoading,
    applyTemplateToReply,
    handleReplyFromTemplate,
    replyFromTemplatePendingTemplateId,
  } = useEnquiriesPageLogic();

  const truncate = (text: string, maxLen: number) =>
    text.length <= maxLen ? text : `${text.slice(0, maxLen)}…`;

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
    <AdminLayout title="Enquiries & templates">
      <>
      <div className="enquiries-page-shell">
        <div className="notifications-tabs" role="tablist" aria-label="Enquiry section">
          <button
            type="button"
            role="tab"
            id="enquiries-tab-list"
            aria-selected={activePanel === 'enquiries'}
            aria-controls="enquiries-panel-list"
            className={`notifications-tabs__btn ${activePanel === 'enquiries' ? 'notifications-tabs__btn--active' : ''}`}
            onClick={() => setActivePanel('enquiries')}
          >
            Enquiries
          </button>
          <button
            type="button"
            role="tab"
            id="enquiries-tab-templates"
            aria-selected={activePanel === 'templates'}
            aria-controls="enquiries-panel-templates"
            className={`notifications-tabs__btn ${activePanel === 'templates' ? 'notifications-tabs__btn--active' : ''}`}
            onClick={() => setActivePanel('templates')}
          >
            Reply templates
          </button>
        </div>

      {activePanel === 'enquiries' && (
      <div className="enquiries-content-wrapper" id="enquiries-panel-list" role="tabpanel" aria-labelledby="enquiries-tab-list">
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
                <label className="filter-label" htmlFor="enquiries-subject-filter">
                  Subject
                </label>
                <select
                  id="enquiries-subject-filter"
                  className="filter-select"
                  value={subjectFilter}
                  onChange={(e) => handleSubjectFilterChange(e.target.value)}
                >
                  <option value="">All subjects</option>
                  {INQUIRY_SUBJECT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
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
                        <div className="enquiry-subject">
                          {getInquirySubjectLabel(enquiry.subject)}
                        </div>
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
      )}

      {activePanel === 'templates' && (
        <InquiryReplyTemplatesPanel isAuthenticated={isAuthenticated} />
      )}
      </div>

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
                  <div className="reply-enquiry-value">
                    {getInquirySubjectLabel(selectedEnquiry.subject)}
                  </div>
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
                <section className="notifications-presets reply-modal-templates" aria-labelledby="reply-templates-heading">
                  <h3 className="notifications-presets__heading" id="reply-templates-heading">
                    Saved reply templates
                  </h3>
                  <p className="notifications-presets__hint">
                    Send the template email in one step, or load the message into the box below to edit before sending.
                  </p>
                  {replyTemplatesLoading ? (
                    <Loading />
                  ) : replyTemplates.length === 0 ? (
                    <p className="notifications-presets__empty">
                      No active templates. Add some under the &quot;Reply templates&quot; tab.
                    </p>
                  ) : (
                    <ul className="notifications-presets__grid">
                      {replyTemplates.map((t) => (
                        <li key={t.id} className="notifications-presets__card">
                          <div className="notifications-presets__card-head">
                            <span className="notifications-presets__card-name">{truncate(t.title, 44)}</span>
                          </div>
                          <p className="notifications-presets__card-preview">
                            <strong>{truncate(t.title, 36)}</strong>
                            <span className="notifications-presets__card-sep"> · </span>
                            {truncate(t.message, 64)}
                          </p>
                          <div className="notifications-presets__card-actions">
                            <button
                              type="button"
                              className="notifications-presets__btn notifications-presets__btn--primary"
                              disabled={isReplying || replyFromTemplatePendingTemplateId !== undefined}
                              onClick={() => handleReplyFromTemplate(t.id)}
                            >
                              {replyFromTemplatePendingTemplateId === t.id ? 'Sending…' : 'Send with template'}
                            </button>
                            <button
                              type="button"
                              className="notifications-presets__btn"
                              disabled={isReplying || replyFromTemplatePendingTemplateId !== undefined}
                              onClick={() => applyTemplateToReply(t)}
                            >
                              Use in reply box
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
                <textarea
                  id="enquiry-reply-textarea"
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
                disabled={
                  isReplying ||
                  !replyMessage.trim() ||
                  replyFromTemplatePendingTemplateId !== undefined
                }
                loading={isReplying}
              >
                Send Reply
              </Button>
            </div>
          </div>
        </div>
      )}
      </>
    </AdminLayout>
  );
};

export default EnquiriesPage;
