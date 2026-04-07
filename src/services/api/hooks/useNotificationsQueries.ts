import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  notificationsApi,
  type BroadcastNotificationRequest,
  type SaveNotificationTemplateRequest,
} from '../notifications.api';

export const notificationKeys = {
  all: ['notifications'] as const,
  templates: () => [...notificationKeys.all, 'templates'] as const,
};

export const useNotificationTemplates = (enabled = true) => {
  return useQuery({
    queryKey: notificationKeys.templates(),
    queryFn: () => notificationsApi.getTemplates(),
    enabled,
  });
};

export const useSendBroadcastNotification = () => {
  return useMutation({
    mutationFn: (data: BroadcastNotificationRequest) => notificationsApi.sendBroadcastNotification(data),
  });
};

export const useSaveNotificationTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SaveNotificationTemplateRequest) => notificationsApi.saveTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.templates() });
    },
  });
};

export const useSendNotificationFromTemplate = () => {
  return useMutation({
    mutationFn: (templateId: string) => notificationsApi.sendTemplate(templateId),
  });
};
