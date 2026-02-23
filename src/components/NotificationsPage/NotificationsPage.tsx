import React from 'react';
import AdminLayout from '@components/common/AdminLayout';
import { useNotificationsPageLogic } from './NotificationsPage.logic';
import './NotificationsPage.scss';

const NotificationsPage: React.FC = () => {
  const {
    title,
    setTitle,
    message,
    setMessage,
    loading,
    error,
    success,
    handleSendNotification,
  } = useNotificationsPageLogic();

  return (
    <AdminLayout title="FCM Notifications">
      <div className="notifications-content-wrapper">
        <div className="notifications-card">
          <h2 className="card-title">Send Broadcast Notification</h2>
          <p className="card-description" style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            This will send a push notification to all registered users via FCM and WebSockets.
          </p>
          
          <form className="notifications-form" onSubmit={handleSendNotification}>
            <div className="form-group">
              <label className="form-label">Notification Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter notification title (e.g. New Event!)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Notification Message</label>
              <textarea
                className="form-textarea"
                placeholder="Enter notification message details..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {error && (
              <div className="notifications-error">
                {error}
              </div>
            )}

            {success && (
              <div className="notifications-success">
                {success}
              </div>
            )}

            <button
              type="submit"
              className="send-button"
              disabled={loading || !title.trim() || !message.trim()}
            >
              {loading ? 'Sending...' : 'Send Notification to All Users'}
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default NotificationsPage;
