import { apiRequest } from './apiClient';

export interface CreateTagPayload {
  name: string;
  colorHex?: string;
  bgHex?: string;
  textHex?: string;
  description?: string;
  taskIds?: string[];
  projectIds?: string[];
  userIds?: string[];
  goalIds?: string[];
}

export const tagService = {
  getTags: async (orgSlug: string) => {
    return apiRequest(`/organizations/${orgSlug}/tags`);
  },

  createTag: async (orgSlug: string, payload: CreateTagPayload) => {
    return apiRequest(`/organizations/${orgSlug}/tags`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateTag: async (orgSlug: string, tagId: string, updates: Partial<CreateTagPayload>) => {
    return apiRequest(`/organizations/${orgSlug}/tags/${tagId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  deleteTag: async (orgSlug: string, tagId: string) => {
    return apiRequest(`/organizations/${orgSlug}/tags/${tagId}`, {
      method: 'DELETE',
    });
  },

  attachTag: async (orgSlug: string, tagId: string, entityType: string, entityId: string) => {
    return apiRequest(`/organizations/${orgSlug}/tags/attach`, {
      method: 'POST',
      body: JSON.stringify({ tagId, entityType, entityId }),
    });
  },

  detachTag: async (orgSlug: string, tagId: string, entityType: string, entityId: string) => {
    return apiRequest(`/organizations/${orgSlug}/tags/detach`, {
      method: 'POST',
      body: JSON.stringify({ tagId, entityType, entityId }),
    });
  },
};
