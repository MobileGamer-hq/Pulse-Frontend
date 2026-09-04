import { apiRequest } from './apiClient';

export const notificationService = {
  getNotifications: async () => {
    return apiRequest('/notifications');
  },

  markAsRead: async (notificationId: string) => {
    return apiRequest(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  },

  markAllAsRead: async () => {
    return apiRequest('/notifications/read-all', {
      method: 'PATCH',
    });
  },
};
