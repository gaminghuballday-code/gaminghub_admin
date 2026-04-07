import { useState } from 'react';
import { AxiosError } from 'axios';
import { useAppDispatch } from '@store/hooks';
import { addToast } from '@store/slices/toastSlice';
import {
  useNotificationTemplates,
  useSaveNotificationTemplate,
  useSendBroadcastNotification,
  useSendNotificationFromTemplate,
} from '@services/api/hooks/useNotificationsQueries';
import type { NotificationPreset } from '@utils/notificationPresets';

const getApiErrorMessage = (err: unknown): string => {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { message?: string } | undefined;
    if (data?.message && typeof data.message === 'string') {
      return data.message;
    }
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'An unexpected error occurred.';
};

export const useNotificationsPageLogic = () => {
  const dispatch = useAppDispatch();
  const { data: templates = [], isLoading: templatesLoading } = useNotificationTemplates();

  const broadcastMutation = useSendBroadcastNotification();
  const saveTemplateMutation = useSaveNotificationTemplate();
  const sendFromTemplateMutation = useSendNotificationFromTemplate();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const [templateName, setTemplateName] = useState('');
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateMessage, setTemplateMessage] = useState('');

  const [activePresetSendId, setActivePresetSendId] = useState<string | null>(null);

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      dispatch(
        addToast({
          message: 'Title and message are required.',
          type: 'warning',
          duration: 5000,
        })
      );
      return;
    }

    broadcastMutation.mutate(
      { title: title.trim(), message: message.trim() },
      {
        onSuccess: (response) => {
          if (response.success) {
            dispatch(
              addToast({
                message: 'Notification sent successfully to all users.',
                type: 'success',
                duration: 5000,
              })
            );
            setTitle('');
            setMessage('');
          } else {
            dispatch(
              addToast({
                message: response.message || 'Failed to send notification.',
                type: 'error',
                duration: 6000,
              })
            );
          }
        },
        onError: (err) => {
          dispatch(
            addToast({
              message: getApiErrorMessage(err),
              type: 'error',
              duration: 6000,
            })
          );
        },
      }
    );
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!templateTitle.trim() || !templateMessage.trim()) {
      dispatch(
        addToast({
          message: 'Template title and message are required.',
          type: 'warning',
          duration: 5000,
        })
      );
      return;
    }

    saveTemplateMutation.mutate(
      {
        title: templateTitle.trim(),
        message: templateMessage.trim(),
        ...(templateName.trim() ? { name: templateName.trim() } : {}),
      },
      {
        onSuccess: () => {
          dispatch(addToast({ message: 'Template saved.', type: 'success', duration: 5000 }));
          setTemplateName('');
          setTemplateTitle('');
          setTemplateMessage('');
        },
        onError: (err) => {
          dispatch(
            addToast({
              message: getApiErrorMessage(err),
              type: 'error',
              duration: 6000,
            })
          );
        },
      }
    );
  };

  const handleSendFromTemplate = (templateId: string) => {
    sendFromTemplateMutation.mutate(templateId, {
      onSuccess: (response) => {
        if (response.success) {
          dispatch(
            addToast({
              message: response.message || 'Notification sent from template.',
              type: 'success',
              duration: 5000,
            })
          );
        } else {
          dispatch(
            addToast({
              message: response.message || 'Failed to send notification from template.',
              type: 'error',
              duration: 6000,
            })
          );
        }
      },
      onError: (err) => {
        dispatch(
          addToast({
            message: getApiErrorMessage(err),
            type: 'error',
            duration: 6000,
          })
        );
      },
    });
  };

  const applyPresetToBroadcast = (preset: NotificationPreset) => {
    setTitle(preset.title);
    setMessage(preset.message);
  };

  const handleSendPresetBroadcast = (preset: NotificationPreset) => {
    setActivePresetSendId(preset.id);
    broadcastMutation.mutate(
      { title: preset.title, message: preset.message },
      {
        onSettled: () => setActivePresetSendId(null),
        onSuccess: (response) => {
          if (response.success) {
            dispatch(
              addToast({
                message: 'Notification sent successfully to all users.',
                type: 'success',
                duration: 5000,
              })
            );
          } else {
            dispatch(
              addToast({
                message: response.message || 'Failed to send notification.',
                type: 'error',
                duration: 6000,
              })
            );
          }
        },
        onError: (err) => {
          dispatch(
            addToast({
              message: getApiErrorMessage(err),
              type: 'error',
              duration: 6000,
            })
          );
        },
      }
    );
  };

  const handleSavePresetAsServerTemplate = (preset: NotificationPreset) => {
    saveTemplateMutation.mutate(
      {
        title: preset.title,
        message: preset.message,
        name: preset.name,
      },
      {
        onSuccess: () => {
          dispatch(
            addToast({
              message: `Saved "${preset.name}" to your template list.`,
              type: 'success',
              duration: 5000,
            })
          );
        },
        onError: (err) => {
          dispatch(
            addToast({
              message: getApiErrorMessage(err),
              type: 'error',
              duration: 6000,
            })
          );
        },
      }
    );
  };

  return {
    title,
    setTitle,
    message,
    setMessage,
    broadcastSending: broadcastMutation.isPending,
    handleSendNotification,
    applyPresetToBroadcast,
    handleSendPresetBroadcast,
    handleSavePresetAsServerTemplate,
    activePresetSendId,

    templates,
    templatesLoading,
    templateName,
    setTemplateName,
    templateTitle,
    setTemplateTitle,
    templateMessage,
    setTemplateMessage,
    templateSaving: saveTemplateMutation.isPending,
    handleSaveTemplate,
    handleSendFromTemplate,
    sendFromTemplatePendingId: sendFromTemplateMutation.isPending
      ? sendFromTemplateMutation.variables
      : undefined,
  };
};
