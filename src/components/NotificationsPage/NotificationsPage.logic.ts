import { useState, useEffect } from 'react';
import { notificationsApi } from '@services/api/notifications.api';

export const useNotificationsPageLogic = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Auto-dismiss success/error messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !message.trim()) {
      setError('Title and message are required.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await notificationsApi.sendBroadcastNotification({
        title: title.trim(),
        message: message.trim(),
      });

      if (response.success) {
        setSuccess('Notification sent successfully to all users.');
        setTitle('');
        setMessage('');
      } else {
        setError(response.message || 'Failed to send notification.');
      }
    } catch (err: any) {
      console.error('Error sending notification:', err);
      setError(err.response?.data?.message || err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return {
    title,
    setTitle,
    message,
    setMessage,
    loading,
    error,
    success,
    handleSendNotification,
  };
};
