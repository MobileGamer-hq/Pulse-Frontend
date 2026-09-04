import { apiRequest } from './apiClient';

export interface UserSyncPayload {
  email: string;
  fullName?: string;
  avatarUrl?: string;
  capacityHoursPerWeek?: number;
}

export const authService = {
  syncUser: async (payload: UserSyncPayload) => {
    return apiRequest('/auth/user-sync', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getMe: async () => {
    return apiRequest('/auth/me');
  },
};
