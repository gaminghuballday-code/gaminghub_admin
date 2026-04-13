import { type FC } from 'react';
import Loading from '@components/common/Loading';
import ConfirmationModal from '@components/common/ConfirmationModal';
import { useInquiryReplyTemplatesPanelLogic } from './InquiryReplyTemplatesPanel.logic';
import '../NotificationsPage/NotificationsPage.scss';
import './EnquiryReplyTemplatesPanel.scss';

interface InquiryReplyTemplatesPanelProps {
  isAuthenticated: boolean;
}

const InquiryReplyTemplatesPanel: FC<InquiryReplyTemplatesPanelProps> = ({ isAuthenticated }) => {
  const {
    includeInactive,
    setIncludeInactive,
    templates,
    templatesLoading,
    templateTitle,
    setTemplateTitle,
    templateMessage,
    setTemplateMessage,
    editingTemplateId,
    saving,
    handleSaveTemplate,
    loadTemplateIntoForm,
    clearForm,
    handleToggleActive,
    togglePending,
    deleteConfirmId,
    setDeleteConfirmId,
    handleConfirmDelete,
    deletePending,
  } = useInquiryReplyTemplatesPanelLogic(isAuthenticated);

  const truncate = (text: string, maxLen: number) =>
    text.length <= maxLen ? text : `${text.slice(0, maxLen)}…`;

  const templateToDelete = deleteConfirmId
    ? templates.find((x) => x.id === deleteConfirmId)
    : undefined;

  return (
    <>
      <div
        className="notifications-card notifications-card--templates"
        role="tabpanel"
        id="enquiries-panel-templates"
        aria-labelledby="enquiries-tab-templates"
      >
        <h2 className="notifications-card__title">Reply templates</h2>
        <p className="notifications-card__description">
          Save reusable email replies for enquiries. Use them from the reply modal or manage them here.
        </p>

        <div className="inquiry-templates-toolbar">
          <label className="inquiry-templates-toolbar__label">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
            <span>Show inactive templates</span>
          </label>
        </div>

        <section className="notifications-presets" aria-labelledby="enquiry-presets-heading">
          <h3 className="notifications-presets__heading" id="enquiry-presets-heading">
            Quick load
          </h3>
          <p className="notifications-presets__hint">
            Open a template into the form below to edit, or create a new template from scratch.
          </p>
          {templatesLoading ? (
            <Loading />
          ) : templates.length === 0 ? (
            <p className="notifications-presets__empty">No templates yet. Use the form below to add one.</p>
          ) : (
            <ul className="notifications-presets__grid">
              {templates.map((t) => (
                <li key={t.id} className="notifications-presets__card">
                  <div className="notifications-presets__card-head">
                    <span className="notifications-presets__card-name">{truncate(t.title, 48)}</span>
                    {!t.isActive && (
                      <span className="inquiry-templates-badge inquiry-templates-badge--inactive">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="notifications-presets__card-preview">
                    <strong>{truncate(t.title, 40)}</strong>
                    <span className="notifications-presets__card-sep"> · </span>
                    {truncate(t.message, 72)}
                  </p>
                  <div className="notifications-presets__card-actions">
                    <button
                      type="button"
                      className="notifications-presets__btn notifications-presets__btn--primary"
                      disabled={saving}
                      onClick={() => loadTemplateIntoForm(t)}
                    >
                      Load into form
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <form className="notifications-form notifications-form--templates" onSubmit={handleSaveTemplate}>
          {editingTemplateId && (
            <p className="inquiry-templates-edit-banner">
              Editing saved template
              <button type="button" className="inquiry-templates-edit-banner__cancel" onClick={clearForm}>
                Cancel
              </button>
            </p>
          )}
          <div className="notifications-form__group">
            <label className="notifications-form__label" htmlFor="inquiry-template-title">
              Title
            </label>
            <input
              id="inquiry-template-title"
              type="text"
              className="notifications-form__input"
              placeholder="Short label (e.g. Thank you for contacting us)"
              value={templateTitle}
              onChange={(e) => setTemplateTitle(e.target.value)}
              disabled={saving}
              required
            />
          </div>
          <div className="notifications-form__group">
            <label className="notifications-form__label" htmlFor="inquiry-template-message">
              Message
            </label>
            <textarea
              id="inquiry-template-message"
              className="notifications-form__textarea"
              placeholder="Email body sent to the user"
              value={templateMessage}
              onChange={(e) => setTemplateMessage(e.target.value)}
              disabled={saving}
              required
            />
          </div>
          <button type="submit" className="notifications-form__submit" disabled={saving}>
            {saving ? 'Saving…' : editingTemplateId ? 'Update template' : 'Save template'}
          </button>
        </form>

        <div className="notifications-templates">
          <h3 className="notifications-templates__heading">Saved templates</h3>
          {templatesLoading ? (
            <Loading />
          ) : templates.length === 0 ? (
            <p className="notifications-templates__empty">No templates yet. Save one using the form above.</p>
          ) : (
            <div className="notifications-templates__table-wrap">
              <table className="notifications-templates__table enquiry-templates-table">
                <thead>
                  <tr>
                    <th scope="col">Title</th>
                    <th scope="col">Message</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="notifications-templates__col-actions enquiry-templates-table__actions">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((t) => (
                    <tr key={t.id}>
                      <td>{truncate(t.title, 40)}</td>
                      <td>{truncate(t.message, 56)}</td>
                      <td>
                        <span
                          className={
                            t.isActive
                              ? 'inquiry-templates-badge inquiry-templates-badge--active'
                              : 'inquiry-templates-badge inquiry-templates-badge--inactive'
                          }
                        >
                          {t.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="notifications-templates__col-actions enquiry-templates-table__actions">
                        <button
                          type="button"
                          className="notifications-templates__send enquiry-templates-table__btn"
                          disabled={saving}
                          onClick={() => loadTemplateIntoForm(t)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="notifications-templates__send enquiry-templates-table__btn"
                          disabled={togglePending}
                          onClick={() => handleToggleActive(t)}
                        >
                          {t.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          className="enquiry-templates-table__btn enquiry-templates-table__btn--danger"
                          disabled={deletePending}
                          onClick={() => setDeleteConfirmId(t.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={deleteConfirmId !== null}
        title="Delete template?"
        message={
          templateToDelete ? (
            <>
              Remove &quot;{truncate(templateToDelete.title, 80)}&quot;? This cannot be undone.
            </>
          ) : (
            'Remove this template? This cannot be undone.'
          )
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </>
  );
};

export default InquiryReplyTemplatesPanel;
