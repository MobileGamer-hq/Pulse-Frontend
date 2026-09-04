import { apiRequest } from './apiClient';

export interface SubmitEODPayload {
  entryDate?: string;
  accomplishments: string[];
  blockers?: string;
  blockedTaskId?: string;
  energyIndex?: number;
  flaggedToManager?: boolean;
  completedTaskIds?: string[];
}

export const eodService = {
  getEodEntries: async (orgSlug: string) => {
    return apiRequest(`/organizations/${orgSlug}/eod`);
  },

  submitEod: async (orgSlug: string, payload: SubmitEODPayload) => {
    return apiRequest(`/organizations/${orgSlug}/eod`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
