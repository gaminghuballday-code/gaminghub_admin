import apiClient from './client';

export interface BroadcastNotificationRequest {
  title: string;
  message: string;
}

export interface BroadcastNotificationResponse {
  status: number;
  success: boolean;
  message: string;
}

export interface NotificationTemplate {
  id: string;
  title: string;
  message: string;
  name?: string;
}

export interface SaveNotificationTemplateRequest {
  title: string;
  message: string;
  name?: string;
}

interface RawNotificationTemplate {
  _id?: string;
  id?: string;
  title?: string;
  message?: string;
  name?: string;
}

function mapTemplate(raw: RawNotificationTemplate): NotificationTemplate | null {
  const id = raw._id ?? raw.id;
  if (!id || typeof raw.title !== 'string' || typeof raw.message !== 'string') {
    return null;
  }
  return {
    id: String(id),
    title: raw.title,
    message: raw.message,
    ...(typeof raw.name === 'string' && raw.name.length > 0 ? { name: raw.name } : {}),
  };
}

function extractTemplatesFromPayload(payload: unknown): RawNotificationTemplate[] {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is RawNotificationTemplate => item !== null && typeof item === 'object');
  }
  if (payload !== null && typeof payload === 'object' && 'templates' in payload) {
    const templates = (payload as { templates: unknown }).templates;
    if (Array.isArray(templates)) {
      return templates.filter(
        (item): item is RawNotificationTemplate => item !== null && typeof item === 'object'
      );
    }
  }
  return [];
}

export const notificationsApi = {
  /**
   * Send a custom push notification to all registered users.
   */
  sendBroadcastNotification: async (data: BroadcastNotificationRequest): Promise<BroadcastNotificationResponse> => {
    const response = await apiClient.post<BroadcastNotificationResponse>('/api/admin/notifications/send', data);
    return response.data;
  },

  /**
   * List saved notification templates.
   */
  getTemplates: async (): Promise<NotificationTemplate[]> => {
    const response = await apiClient.get<{ data: unknown }>('/api/admin/notifications/templates');
    const rawList = extractTemplatesFromPayload(response.data.data);
    return rawList
      .map((raw) => mapTemplate(raw))
      .filter((t): t is NotificationTemplate => t !== null);
  },

  /**
   * Create or save a notification template.
   */
  saveTemplate: async (data: SaveNotificationTemplateRequest): Promise<NotificationTemplate> => {
    const response = await apiClient.post<{ data: unknown }>('/api/admin/notifications/templates', data);
    const payload = response.data.data;
    if (payload !== null && typeof payload === 'object') {
      const mapped = mapTemplate(payload as RawNotificationTemplate);
      if (mapped) {
        return mapped;
      }
    }
    throw new Error('Template was not returned in the expected shape from the server.');
  },

  /**
   * Send notification using a saved template (broadcast from template).
   */
  sendTemplate: async (templateId: string): Promise<BroadcastNotificationResponse> => {
    const response = await apiClient.post<BroadcastNotificationResponse>(
      `/api/admin/notifications/templates/${encodeURIComponent(templateId)}/send`,
      {}
    );
    return response.data;
  },
};
