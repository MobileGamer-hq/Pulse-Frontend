import { apiRequest } from './apiClient';

export interface KeyResultPayload {
  title: string;
  targetValue: number;
  currentValue?: number;
  unit?: string;
}

export interface CreateGoalPayload {
  title: string;
  description?: string;
  ownerType?: 'org' | 'team' | 'individual';
  ownerId?: string;
  targetDate: string;
  status?: 'on_track' | 'at_risk' | 'behind' | 'achieved';
  keyResults?: KeyResultPayload[];
}

export const goalService = {
  getGoals: async (orgSlug: string) => {
    return apiRequest(`/organizations/${orgSlug}/goals`);
  },

  createGoal: async (orgSlug: string, payload: CreateGoalPayload) => {
    return apiRequest(`/organizations/${orgSlug}/goals`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
