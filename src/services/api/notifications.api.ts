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

export const notificationsApi = {
  /**
   * Send a custom push notification to all registered users.
   * @param data - The notification title and message.
   */
  sendBroadcastNotification: async (data: BroadcastNotificationRequest): Promise<BroadcastNotificationResponse> => {
    const response = await apiClient.post<BroadcastNotificationResponse>('/api/admin/notifications/send', data);
    return response.data;
  },
};
