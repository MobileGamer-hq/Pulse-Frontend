import { apiRequest } from './apiClient';

export const webhooksService = {
  getWebhooks: async (orgSlug: string) => {
    return apiRequest(`/organizations/${orgSlug}/webhooks`);
  },

  createWebhook: async (orgSlug: string, payload: { name: string; targetUrl: string; eventTriggers?: string[] }) => {
    return apiRequest(`/organizations/${orgSlug}/webhooks`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getApiKeys: async (orgSlug: string) => {
    return apiRequest(`/organizations/${orgSlug}/webhooks/api-keys`);
  },

  createApiKey: async (orgSlug: string, payload: { name: string; scopes?: string[] }) => {
    return apiRequest(`/organizations/${orgSlug}/webhooks/api-keys`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
