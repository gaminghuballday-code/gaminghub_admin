import { useState } from 'react';
import type { FC } from 'react';
import AdminLayout from '@components/common/AdminLayout';
import Loading from '@components/common/Loading';
import { useNotificationsPageLogic } from './NotificationsPage.logic';
import './NotificationsPage.scss';

const NotificationsPage: FC = () => {
  const {
    title,
    setTitle,
    message,
    setMessage,
    broadcastSending,
    handleSendNotification,
    templates,
    templatesLoading,
    templateName,
    setTemplateName,
    templateTitle,
    setTemplateTitle,
    templateMessage,
    setTemplateMessage,
    templateSaving,
    handleSaveTemplate,
    handleSendFromTemplate,
    sendFromTemplatePendingId,
    applyTemplateToBroadcast,
    handleSendTemplateBroadcast,
    activeTemplateSendId,
  } = useNotificationsPageLogic();

  const [activePanel, setActivePanel] = useState<'broadcast' | 'templates'>('broadcast');

  const truncate = (text: string, maxLen: number) =>
    text.length <= maxLen ? text : `${text.slice(0, maxLen)}…`;

  const templateCardLabel = (title: string, name?: string) => {
    const n = name?.trim();
    return n && n.length > 0 ? n : title;
  };

  return (
    <AdminLayout title=" Notifications & Templates">
      <div className="notifications-content-wrapper">
        <div className="notifications-tabs" role="tablist" aria-label="Notification actions">
          <button
            type="button"
            role="tab"
            id="notifications-tab-broadcast"
            aria-selected={activePanel === 'broadcast'}
            aria-controls="notifications-panel-broadcast"
            className={`notifications-tabs__btn ${activePanel === 'broadcast' ? 'notifications-tabs__btn--active' : ''}`}
            onClick={() => setActivePanel('broadcast')}
          >
            Send broadcast
          </button>
          <button
            type="button"
            role="tab"
            id="notifications-tab-templates"
            aria-selected={activePanel === 'templates'}
            aria-controls="notifications-panel-templates"
            className={`notifications-tabs__btn ${activePanel === 'templates' ? 'notifications-tabs__btn--active' : ''}`}
            onClick={() => setActivePanel('templates')}
          >
            Templates (save and send)
          </button>
        </div>

        {activePanel === 'broadcast' && (
          <div
            className="notifications-card"
            role="tabpanel"
            id="notifications-panel-broadcast"
            aria-labelledby="notifications-tab-broadcast"
          >
          <h2 className="notifications-card__title">Send Broadcast Notification</h2>
          <p className="notifications-card__description">
            This will send a push notification to all registered users via FCM and WebSockets.
          </p>

          <section className="notifications-presets" aria-labelledby="notifications-presets-broadcast-heading">
            <h3 className="notifications-presets__heading" id="notifications-presets-broadcast-heading">
              Default messages (one-click)
            </h3>
            <p className="notifications-presets__hint">
              Use a ready-made title and message. Send immediately, or load into the form below to edit before sending.
            </p>
            {templatesLoading ? (
              <Loading />
            ) : templates.length === 0 ? (
              <p className="notifications-presets__empty">
                No templates yet. Add them under &quot;Templates (save and send)&quot; or ensure defaults are configured
                on the server.
              </p>
            ) : (
              <ul className="notifications-presets__grid">
                {templates.map((t) => (
                  <li key={t.id} className="notifications-presets__card">
                    <div className="notifications-presets__card-head">
                      <span className="notifications-presets__card-name">
                        {truncate(templateCardLabel(t.title, t.name), 48)}
                      </span>
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
                        disabled={broadcastSending}
                        onClick={() => handleSendTemplateBroadcast(t)}
                      >
                        {broadcastSending && activeTemplateSendId === t.id ? 'Sending…' : 'Send now'}
                      </button>
                      <button
                        type="button"
                        className="notifications-presets__btn"
                        disabled={broadcastSending}
                        onClick={() => {
                          applyTemplateToBroadcast(t);
                          document.getElementById('broadcast-title')?.focus();
                        }}
                      >
                        Use in form
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <form className="notifications-form" onSubmit={handleSendNotification}>
            <div className="notifications-form__group">
              <label className="notifications-form__label" htmlFor="broadcast-title">
                Notification Title
              </label>
              <input
                id="broadcast-title"
                type="text"
                className="notifications-form__input"
                placeholder="Enter notification title (e.g. New Event!)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={broadcastSending}
                required
              />
            </div>

            <div className="notifications-form__group">
              <label className="notifications-form__label" htmlFor="broadcast-message">
                Notification Message
              </label>
              <textarea
                id="broadcast-message"
                className="notifications-form__textarea"
                placeholder="Enter notification message details..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={broadcastSending}
                required
              />
            </div>

            <button
              type="submit"
              className="notifications-form__submit"
              disabled={broadcastSending || !title.trim() || !message.trim()}
            >
              {broadcastSending ? 'Sending...' : 'Send Notification to All Users'}
            </button>
          </form>
        </div>
        )}

        {activePanel === 'templates' && (
          <div
            className="notifications-card notifications-card--templates"
            role="tabpanel"
            id="notifications-panel-templates"
            aria-labelledby="notifications-tab-templates"
          >
          <h2 className="notifications-card__title">Notification templates</h2>
          <p className="notifications-card__description">
            Save reusable title and message pairs, then send a broadcast from a template in one click.
          </p>

          <section className="notifications-presets" aria-labelledby="notifications-presets-templates-heading">
            <h3 className="notifications-presets__heading" id="notifications-presets-templates-heading">
              Default messages
            </h3>
            <p className="notifications-presets__hint">
              Send to everyone now, or load into the form to edit before saving a new copy.
            </p>
            {templatesLoading ? (
              <Loading />
            ) : templates.length === 0 ? (
              <p className="notifications-presets__empty">
                No templates yet. Use the form below to save your first template.
              </p>
            ) : (
              <ul className="notifications-presets__grid">
                {templates.map((t) => (
                  <li key={t.id} className="notifications-presets__card">
                    <div className="notifications-presets__card-head">
                      <span className="notifications-presets__card-name">
                        {truncate(templateCardLabel(t.title, t.name), 48)}
                      </span>
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
                        disabled={broadcastSending}
                        onClick={() => handleSendTemplateBroadcast(t)}
                      >
                        {broadcastSending && activeTemplateSendId === t.id ? 'Sending…' : 'Send now'}
                      </button>
                      <button
                        type="button"
                        className="notifications-presets__btn"
                        disabled={broadcastSending || templateSaving}
                        onClick={() => {
                          setTemplateName(t.name ?? '');
                          setTemplateTitle(t.title);
                          setTemplateMessage(t.message);
                          document.getElementById('template-title')?.focus();
                        }}
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
            <div className="notifications-form__group">
              <label className="notifications-form__label" htmlFor="template-name">
                Template name <span className="notifications-form__optional">(optional)</span>
              </label>
              <input
                id="template-name"
                type="text"
                className="notifications-form__input"
                placeholder="e.g. Weekly recap"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                disabled={templateSaving}
              />
            </div>
            <div className="notifications-form__group">
              <label className="notifications-form__label" htmlFor="template-title">
                Title
              </label>
              <input
                id="template-title"
                type="text"
                className="notifications-form__input"
                placeholder="Notification title"
                value={templateTitle}
                onChange={(e) => setTemplateTitle(e.target.value)}
                disabled={templateSaving}
                required
              />
            </div>
            <div className="notifications-form__group">
              <label className="notifications-form__label" htmlFor="template-message">
                Message
              </label>
              <textarea
                id="template-message"
                className="notifications-form__textarea"
                placeholder="Notification body"
                value={templateMessage}
                onChange={(e) => setTemplateMessage(e.target.value)}
                disabled={templateSaving}
                required
              />
            </div>
            <button type="submit" className="notifications-form__submit" disabled={templateSaving}>
              {templateSaving ? 'Saving...' : 'Save template'}
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
                <table className="notifications-templates__table">
                  <thead>
                    <tr>
                      <th scope="col">Name</th>
                      <th scope="col">Title</th>
                      <th scope="col">Message</th>
                      <th scope="col" className="notifications-templates__col-actions">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map((t) => (
                      <tr key={t.id}>
                        <td>{t.name ?? '—'}</td>
                        <td>{truncate(t.title, 48)}</td>
                        <td>{truncate(t.message, 64)}</td>
                        <td className="notifications-templates__col-actions">
                          <button
                            type="button"
                            className="notifications-templates__send"
                            disabled={sendFromTemplatePendingId === t.id}
                            onClick={() => handleSendFromTemplate(t.id)}
                          >
                            {sendFromTemplatePendingId === t.id ? 'Sending…' : 'Send'}
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
        )}
      </div>
    </AdminLayout>
  );
};

export default NotificationsPage;
